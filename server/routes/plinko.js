import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { nextGameId, persistUsers, pushRecentGame, recordHouseStats, store } from "../state/store.js";
import { createFairContext, hashToFloat } from "../utils/provablyFair.js";
import { createError, ensurePositiveBet } from "../utils/helpers.js";
import { getPlinkoMultipliers, resolveRisk } from "../utils/gameMath.js";

const router = Router();

const DEFAULT_ROWS = 12;
const DEFAULT_RISK = "medium";

router.use(authMiddleware);

router.post("/drop", async (req, res, next) => {
  try {
    const bet = ensurePositiveBet(req.body.bet, req.user.balance);
    const rows = Number(req.body.rows || DEFAULT_ROWS);
    const risk = resolveRisk(req.body.risk);

    if (!Number.isInteger(rows) || rows < 8 || rows > 16) {
      throw createError("Rows must be between 8 and 16.");
    }

    const fair = createFairContext(req.user, req.body.clientSeed);
    const multipliers = getPlinkoMultipliers(rows, risk);
    const path = [];
    let position = 0;

    for (let i = 0; i < rows; i += 1) {
      const stepFair = hashToFloat(fair.serverSeed, fair.clientSeed, fair.nonce + i);
      const direction = stepFair.value < 0.5 ? -1 : 1;
      path.push(direction);
      position += direction;
    }

    const index = Math.max(0, Math.min(multipliers.length - 1, Math.floor((position + rows) / 2)));
    const multiplier = multipliers[index] || 0.2;
    const payout = Number((bet * multiplier).toFixed(2));
    const gameId = nextGameId("plinko");

    req.user.balance = Number((req.user.balance - bet + payout).toFixed(2));
    req.user.clientSeed = fair.clientSeed;
    req.user.nonce += 1;

    store.games.set(gameId, {
      gameId,
      userId: req.user.id,
      gameType: "plinko",
      bet,
      active: false,
      multiplier,
      serverSeed: fair.serverSeed,
      serverSeedHash: fair.serverSeedHash,
      clientSeed: fair.clientSeed,
      nonce: fair.nonce,
      createdAt: new Date().toISOString(),
      result: {
        rows,
        risk,
        position,
        index,
        path,
        payout
      }
    });

    pushRecentGame({
      _id: gameId,
      userId: req.user.id,
      gameType: "plinko",
      betAmount: bet,
      profit: Number((payout - bet).toFixed(2)),
      status: payout > bet ? "won" : payout === bet ? "push" : "lost"
    });
    recordHouseStats("plinko", bet, payout);

    await persistUsers();

    return res.status(201).json({
      balance: req.user.balance,
      game: {
        gameId,
        bet,
        rows,
        risk,
        path,
        multipliers,
        bucketIndex: index,
        multiplier,
        payout,
        provablyFair: {
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
