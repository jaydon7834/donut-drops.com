import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { nextGameId, persistUsers, pushRecentGame, store } from "../state/store.js";
import { createFairContext, hashToFloat } from "../utils/provablyFair.js";
import { createError, ensurePositiveBet } from "../utils/helpers.js";

const router = Router();

const DEFAULT_ROWS = 12;
const DEFAULT_RISK = "medium";
const PLINKO_RISK_TABLES = {
  low: [2, 1.5, 1.2, 1.1, 1.05, 1.02, 1, 1.02, 1.05, 1.1, 1.2, 1.5, 2],
  medium: [5, 3, 2, 1.5, 1.2, 0.8, 0.5, 0.8, 1.2, 1.5, 2, 3, 5],
  high: [33, 11, 4, 2, 1.2, 0.5, 0.2, 0.5, 1.2, 2, 4, 11, 33]
};

function resolveRisk(risk) {
  const normalizedRisk = String(risk || DEFAULT_RISK).trim().toLowerCase();
  return PLINKO_RISK_TABLES[normalizedRisk] ? normalizedRisk : DEFAULT_RISK;
}

function interpolateValue(source, position) {
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);

  if (lowerIndex === upperIndex) {
    return source[lowerIndex];
  }

  const weight = position - lowerIndex;
  return source[lowerIndex] * (1 - weight) + source[upperIndex] * weight;
}

function getPlinkoMultipliers(rows, risk = DEFAULT_RISK) {
  const source = PLINKO_RISK_TABLES[resolveRisk(risk)];
  const bucketCount = rows + 1;

  if (bucketCount === source.length) {
    return source;
  }

  return Array.from({ length: bucketCount }, (_, index) => {
    const position = (index / (bucketCount - 1)) * (source.length - 1);
    return Number(interpolateValue(source, position).toFixed(2));
  });
}

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

export { getPlinkoMultipliers, PLINKO_RISK_TABLES, resolveRisk };
export default router;
