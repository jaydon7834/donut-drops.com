import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { nextGameId, persistUsers, pushRecentGame, store } from "../state/store.js";
import { createFairContext, hashToFloat } from "../utils/provablyFair.js";
import { createError, ensurePositiveBet } from "../utils/helpers.js";

const router = Router();

router.use(authMiddleware);

router.post("/roll", async (req, res, next) => {
  try {
    const bet = ensurePositiveBet(req.body.bet, req.user.balance);
    const target = Number(req.body.target);

    if (!Number.isFinite(target) || target < 1.01 || target > 10) {
      throw createError("Target multiplier must be between 1.01 and 10.");
    }

    const fair = createFairContext(req.user, req.body.clientSeed);
    const { hash } = hashToFloat(fair.serverSeed, fair.clientSeed, fair.nonce);
    const integer = parseInt(hash.substring(0, 13), 16);
    const max = 2 ** 52;

    let rolledMultiplier = Math.floor((100 * max) / (max - integer)) / 100;
    rolledMultiplier *= 0.99;
    rolledMultiplier = Number(rolledMultiplier.toFixed(2));

    const win = rolledMultiplier >= target;
    const payout = win ? Number((bet * target).toFixed(2)) : 0;
    const gameId = nextGameId("limbo");

    req.user.balance = Number((req.user.balance - bet + payout).toFixed(2));
    req.user.clientSeed = fair.clientSeed;
    req.user.nonce += 1;

    store.games.set(gameId, {
      gameId,
      userId: req.user.id,
      gameType: "limbo",
      bet,
      active: false,
      multiplier: win ? Number(target.toFixed(2)) : 0,
      serverSeed: fair.serverSeed,
      serverSeedHash: fair.serverSeedHash,
      clientSeed: fair.clientSeed,
      nonce: fair.nonce,
      createdAt: new Date().toISOString(),
      result: {
        rolledMultiplier,
        target,
        win
      }
    });

    pushRecentGame({
      _id: gameId,
      userId: req.user.id,
      gameType: "limbo",
      betAmount: bet,
      profit: Number((payout - bet).toFixed(2)),
      status: win ? "won" : "lost"
    });

    await persistUsers();

    return res.status(201).json({
      balance: req.user.balance,
      game: {
        gameId,
        bet,
        payout,
        multiplier: rolledMultiplier,
        target,
        win,
        provablyFair: {
          hash,
          serverSeedHash: fair.serverSeedHash,
          serverSeed: fair.serverSeed,
          clientSeed: fair.clientSeed,
          nonce: fair.nonce
        }
      }
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
