import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { nextGameId, persistUsers, pushRecentGame, recordHouseStats, store } from "../state/store.js";
import { createFairContext, hashToFloat } from "../utils/provablyFair.js";
import { createError, ensurePositiveBet } from "../utils/helpers.js";
import { calculateLimboResultFromHash } from "../utils/gameMath.js";

const router = Router();

router.use(authMiddleware);

router.post("/roll", async (req, res, next) => {
  try {
    const bet = ensurePositiveBet(req.body.bet, req.user.balance);
    const target = Number(req.body.target);

    if (!Number.isFinite(target) || target < 1.01 || target > 100) {
      throw createError("Target multiplier must be between 1.01 and 100.");
    }

    const fair = createFairContext(req.user, req.body.clientSeed);
    const { hash } = hashToFloat(fair.serverSeed, fair.clientSeed, fair.nonce);
    const rolledMultiplier = calculateLimboResultFromHash(hash);

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
    recordHouseStats("limbo", bet, payout);

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
