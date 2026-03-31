import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { nextGameId, persistUsers, pushRecentGame, recordHouseStats, store } from "../state/store.js";
import { createFairContext, generateDiceResult } from "../utils/provablyFair.js";
import { createError, ensurePositiveBet } from "../utils/helpers.js";
import { calculateDiceMultiplier } from "../utils/gameMath.js";

const router = Router();

router.use(authMiddleware);

router.post("/roll", async (req, res, next) => {
  try {
    const bet = ensurePositiveBet(req.body.bet, req.user.balance);
    const target = Number(req.body.target);
    const over = Boolean(req.body.over);
    const clientSeed = req.body.clientSeed;

    if (!Number.isFinite(target) || target <= 1 || target >= 99) {
      throw createError("Target must be between 1 and 99.");
    }

    const fair = createFairContext(req.user, clientSeed);
    const result = generateDiceResult(fair);
    const isWin = over ? result.roll > target : result.roll < target;
    const multiplier = calculateDiceMultiplier(target, over, bet);
    const payout = isWin ? Number((bet * multiplier).toFixed(2)) : 0;
    const gameId = nextGameId("dice");

    req.user.balance = Number((req.user.balance - bet + payout).toFixed(2));
    req.user.clientSeed = fair.clientSeed;
    req.user.nonce += 1;

    store.games.set(gameId, {
      gameId,
      userId: req.user.id,
      gameType: "dice",
      bet,
      active: false,
      multiplier,
      serverSeed: fair.serverSeed,
      serverSeedHash: fair.serverSeedHash,
      clientSeed: fair.clientSeed,
      nonce: fair.nonce,
      createdAt: new Date().toISOString(),
      result: {
        roll: result.roll,
        target,
        over,
        isWin
      }
    });

    pushRecentGame({
      _id: gameId,
      userId: req.user.id,
      gameType: "dice",
      betAmount: bet,
      profit: Number((payout - bet).toFixed(2)),
      status: isWin ? "won" : "lost"
    });
    recordHouseStats("dice", bet, payout);
    await persistUsers();

    return res.status(201).json({
      balance: req.user.balance,
      game: {
        gameId,
        bet,
        payout,
        result: {
          roll: result.roll,
          target,
          over,
          isWin,
          multiplier
        },
        provablyFair: {
          hash: result.hash,
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
