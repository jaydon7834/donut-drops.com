import crypto from "crypto";
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { nextGameId, persistUsers, pushRecentGame, store } from "../state/store.js";
import { createError, ensurePositiveBet } from "../utils/helpers.js";

const router = Router();

const suits = ["♠", "♥", "♦", "♣"];
const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

function randomInt(maxExclusive) {
  return crypto.randomInt(0, maxExclusive);
}

function createDeck() {
  const deck = [];

  suits.forEach((suit) => {
    values.forEach((value) => {
      deck.push({ value, suit });
    });
  });

  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }

  return deck;
}

function getHandValue(hand) {
  let total = 0;
  let aces = 0;

  hand.forEach((card) => {
    if (["J", "Q", "K"].includes(card.value)) {
      total += 10;
    } else if (card.value === "A") {
      total += 11;
      aces += 1;
    } else {
      total += Number(card.value);
    }
  });

  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }

  return total;
}

function visibleDealerHand(hand, revealAll = false) {
  if (revealAll) {
    return hand;
  }

  return [hand[0], { hidden: true }];
}

function settleRecentGame({ game, userId, profit, status }) {
  pushRecentGame({
    _id: game.gameId,
    userId,
    gameType: "blackjack",
    betAmount: game.bet,
    profit,
    status
  });
}

router.use(authMiddleware);

router.post("/start", async (req, res, next) => {
  try {
    const bet = ensurePositiveBet(req.body.bet, req.user.balance);

    const existingActiveGame = Array.from(store.games.values()).find(
      (game) => game.userId === req.user.id && game.gameType === "blackjack" && game.active
    );

    if (existingActiveGame) {
      throw createError("You already have an active blackjack game.");
    }

    const deck = createDeck();
    const player = [deck.pop(), deck.pop()];
    const dealer = [deck.pop(), deck.pop()];
    const gameId = nextGameId("blackjack");

    req.user.balance = Number((req.user.balance - bet).toFixed(2));

    const game = {
      gameId,
      userId: req.user.id,
      gameType: "blackjack",
      deck,
      player,
      dealer,
      bet,
      active: true,
      createdAt: new Date().toISOString()
    };

    store.games.set(gameId, game);
    await persistUsers();

    return res.status(201).json({
      balance: req.user.balance,
      game: {
        gameId,
        player,
        dealer: visibleDealerHand(dealer),
        playerValue: getHandValue(player),
        dealerValue: getHandValue([dealer[0]]),
        active: true
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/hit", async (req, res, next) => {
  try {
    const gameId = String(req.body.gameId || "");
    const game = store.games.get(gameId);

    if (!game || game.userId !== req.user.id || game.gameType !== "blackjack") {
      throw createError("Game not found.", 404);
    }

    if (!game.active) {
      throw createError("This blackjack game is no longer active.");
    }

    game.player.push(game.deck.pop());
    const playerValue = getHandValue(game.player);

    if (playerValue > 21) {
      game.active = false;
      settleRecentGame({
        game,
        userId: req.user.id,
        profit: -game.bet,
        status: "lost"
      });
      await persistUsers();

      return res.json({
        balance: req.user.balance,
        game: {
          gameId: game.gameId,
          player: game.player,
          dealer: game.dealer,
          playerValue,
          dealerValue: getHandValue(game.dealer),
          active: false,
          result: "lose",
          payout: 0
        }
      });
    }

    return res.json({
      balance: req.user.balance,
      game: {
        gameId: game.gameId,
        player: game.player,
        dealer: visibleDealerHand(game.dealer),
        playerValue,
        dealerValue: getHandValue([game.dealer[0]]),
        active: true
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/stand", async (req, res, next) => {
  try {
    const gameId = String(req.body.gameId || "");
    const game = store.games.get(gameId);

    if (!game || game.userId !== req.user.id || game.gameType !== "blackjack") {
      throw createError("Game not found.", 404);
    }

    if (!game.active) {
      throw createError("This blackjack game is no longer active.");
    }

    while (getHandValue(game.dealer) < 17) {
      game.dealer.push(game.deck.pop());
    }

    const playerValue = getHandValue(game.player);
    const dealerValue = getHandValue(game.dealer);
    let result = "lose";
    let payout = 0;

    if (dealerValue > 21 || playerValue > dealerValue) {
      result = "win";
      payout = game.bet * 2;
    } else if (playerValue === dealerValue) {
      result = "draw";
      payout = game.bet;
    }

    payout = Number(payout.toFixed(2));
    req.user.balance = Number((req.user.balance + payout).toFixed(2));
    game.active = false;

    settleRecentGame({
      game,
      userId: req.user.id,
      profit: Number((payout - game.bet).toFixed(2)),
      status: result === "draw" ? "push" : result === "win" ? "won" : "lost"
    });
    await persistUsers();

    return res.json({
      balance: req.user.balance,
      game: {
        gameId: game.gameId,
        player: game.player,
        dealer: game.dealer,
        playerValue,
        dealerValue,
        active: false,
        result,
        payout
      }
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
