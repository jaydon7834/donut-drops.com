import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { nextGameId, persistUsers, pushRecentGame, recordHouseStats, store } from "../state/store.js";
import { createError, ensurePositiveBet } from "../utils/helpers.js";
import { calculateChickenMultiplier } from "../utils/gameMath.js";

const router = Router();
const RISK_MODES = {
  low: 0.8,
  medium: 0.75,
  high: 0.7
};

router.use(authMiddleware);

router.post("/start", async (req, res, next) => {
  try {
    const bet = ensurePositiveBet(req.body.bet, req.user.balance);
    const risk = String(req.body.risk || "medium").toLowerCase();
    const surviveChance = RISK_MODES[risk];

    if (!surviveChance) {
      throw createError("Risk must be low, medium, or high.");
    }

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
      surviveChance,
      risk,
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

    if (Math.random() > game.surviveChance) {
      game.active = false;
      recordHouseStats("chicken", game.bet, 0);

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
    game.multiplier = calculateChickenMultiplier(game.step, game.surviveChance);

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
    recordHouseStats("chicken", game.bet, payout);

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
