import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { nextGameId, persistUsers, pushRecentGame, store } from "../state/store.js";
import { createFairContext, hashToFloat } from "../utils/provablyFair.js";
import { createError, ensurePositiveBet } from "../utils/helpers.js";

const router = Router();

const wheel = [
  0, 32, 15, 19, 4, 21, 2, 25,
  17, 34, 6, 27, 13, 36, 11, 30,
  8, 23, 10, 5, 24, 16, 33, 1,
  20, 14, 31, 9, 22, 18, 29, 7,
  28, 12, 35, 3, 26
];

const redNumbers = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36
]);

function getColor(number) {
  if (number === 0) {
    return "green";
  }

  return redNumbers.has(number) ? "red" : "black";
}

router.use(authMiddleware);

router.post("/spin", async (req, res, next) => {
  try {
    const bet = ensurePositiveBet(req.body.bet, req.user.balance);
    const type = String(req.body.type || "color").toLowerCase();
    const fair = createFairContext(req.user, req.body.clientSeed);
    const { hash, value } = hashToFloat(fair.serverSeed, fair.clientSeed, fair.nonce);
    const index = Math.floor(value * wheel.length) % wheel.length;
    const number = wheel[index];
    const color = getColor(number);
    let win = false;
    let payout = 0;

    if (type === "color") {
      const selectedColor = String(req.body.value || "").toLowerCase();

      if (!["red", "black", "green"].includes(selectedColor)) {
        throw createError("Choose red, black, or green.");
      }

      if (selectedColor === color) {
        win = true;
        payout = selectedColor === "green" ? bet * 14 : bet * 2;
      }
    } else if (type === "number") {
      const selectedNumber = Number(req.body.value);

      if (!Number.isInteger(selectedNumber) || selectedNumber < 0 || selectedNumber > 36) {
        throw createError("Choose a number between 0 and 36.");
      }

      if (selectedNumber === number) {
        win = true;
        payout = bet * 36;
      }
    } else {
      throw createError("Unsupported roulette bet type.");
    }

    payout = Number(payout.toFixed(2));
    req.user.balance = Number((req.user.balance - bet + payout).toFixed(2));
    req.user.clientSeed = fair.clientSeed;
    req.user.nonce += 1;

    const gameId = nextGameId("roulette");

    store.games.set(gameId, {
      gameId,
      userId: req.user.id,
      gameType: "roulette",
      bet,
      active: false,
      multiplier: payout > 0 ? Number((payout / bet).toFixed(2)) : 0,
      serverSeed: fair.serverSeed,
      serverSeedHash: fair.serverSeedHash,
      clientSeed: fair.clientSeed,
      nonce: fair.nonce,
      createdAt: new Date().toISOString(),
      result: {
        index,
        number,
        color,
        type,
        selection: req.body.value,
        win
      }
    });

    pushRecentGame({
      _id: gameId,
      userId: req.user.id,
      gameType: "roulette",
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
        number,
        color,
        index,
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

export { wheel, getColor };
export default router;
