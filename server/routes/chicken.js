import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { nextGameId, persistUsers, pushRecentGame, store } from "../state/store.js";
import { createError, ensurePositiveBet } from "../utils/helpers.js";

const router = Router();
const SURVIVE_CHANCE = 0.75;

router.use(authMiddleware);

router.post("/start", async (req, res, next) => {
  try {
    const bet = ensurePositiveBet(req.body.bet, req.user.balance);

    const existingActiveGame = Array.from(store.games.values()).find(
      (game) => game.userId === req.user.id && game.gameType === "chicken" && game.active
    );

    if (existingActiveGame) {
      throw createError("You already have an active chicken run.");
    }

    req.user.balance = Number((req.user.balance - bet).toFixed(2));

    const game = {
      gameId: nextGameId("chicken"),
      userId: req.user.id,
      gameType: "chicken",
      bet,
      step: 0,
      multiplier: 1,
      surviveChance: SURVIVE_CHANCE,
      active: true,
      createdAt: new Date().toISOString()
    };

    store.games.set(game.gameId, game);
    await persistUsers();

    return res.status(201).json({
      balance: req.user.balance,
      game
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/step", (req, res, next) => {
  try {
    const gameId = String(req.body.gameId || "");
    const game = store.games.get(gameId);

    if (!game || game.userId !== req.user.id || game.gameType !== "chicken") {
      throw createError("Game not found.", 404);
    }

    if (!game.active) {
      throw createError("This chicken game is no longer active.");
    }

    if (Math.random() > SURVIVE_CHANCE) {
      game.active = false;

      pushRecentGame({
        _id: game.gameId,
        userId: req.user.id,
        gameType: "chicken",
        betAmount: game.bet,
        profit: -game.bet,
        status: "lost"
      });

      return res.json({
        balance: req.user.balance,
        game: {
          ...game,
          result: "lose",
          payout: 0
        }
      });
    }

    game.step += 1;
    game.multiplier = Number((game.multiplier * 1.25).toFixed(2));

    return res.json({
      balance: req.user.balance,
      game: {
        ...game,
        result: "safe"
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/cashout", async (req, res, next) => {
  try {
    const gameId = String(req.body.gameId || "");
    const game = store.games.get(gameId);

    if (!game || game.userId !== req.user.id || game.gameType !== "chicken") {
      throw createError("Game not found.", 404);
    }

    if (!game.active) {
      throw createError("This chicken game is no longer active.");
    }

    const payout = Number((game.bet * game.multiplier).toFixed(2));
    req.user.balance = Number((req.user.balance + payout).toFixed(2));
    game.active = false;

    pushRecentGame({
      _id: game.gameId,
      userId: req.user.id,
      gameType: "chicken",
      betAmount: game.bet,
      profit: Number((payout - game.bet).toFixed(2)),
      status: "cashed_out"
    });
    await persistUsers();

    return res.json({
      balance: req.user.balance,
      payout,
      game: {
        ...game,
        result: "cashout"
      }
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
