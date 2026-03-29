import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { persistUsers, pushRecentGame } from "../state/store.js";
import { createFairContext, generateDiceResult } from "../utils/provablyFair.js";
import { createError, ensurePositiveBet } from "../utils/helpers.js";

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
    const chance = over ? 100 - target : target;
    const multiplier = Number((99 / chance).toFixed(2));
    const payout = isWin ? Number((bet * multiplier).toFixed(2)) : 0;

    req.user.balance = Number((req.user.balance - bet + payout).toFixed(2));
    req.user.clientSeed = fair.clientSeed;
    req.user.nonce += 1;

    pushRecentGame({
      _id: `dice_${Date.now()}`,
      userId: req.user.id,
      gameType: "dice",
      betAmount: bet,
      profit: Number((payout - bet).toFixed(2)),
      status: isWin ? "won" : "lost"
    });
    await persistUsers();

    return res.status(201).json({
      balance: req.user.balance,
      game: {
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
