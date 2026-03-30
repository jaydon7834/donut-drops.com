import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { persistUsers, pushRecentGame } from "../state/store.js";
import { createFairContext, generateDiceResult } from "../utils/provablyFair.js";
import { createError, ensurePositiveBet } from "../utils/helpers.js";

const router = Router();

function resolveInstantResult(gameType, rawValue, payload) {
  if (gameType === "blackjack") {
    const player = 16 + Math.floor(rawValue * 6);
    const dealer = 16 + Math.floor(((rawValue * 37) % 1) * 6);
    const playerBust = player > 21;
    const dealerBust = dealer > 21;
    const isWin = !playerBust && (dealerBust || player > dealer);
    const isPush = !playerBust && !dealerBust && player === dealer;

    return {
      title: isPush ? "Push" : isWin ? "Player Wins" : "Dealer Wins",
      multiplier: isPush ? 1 : isWin ? 2 : 0,
      details: { player, dealer }
    };
  }

  if (gameType === "roulette") {
    const pocket = Math.floor(rawValue * 15);
    const selection = payload.selection || "red";
    const color = pocket === 0 ? "green" : pocket % 2 === 0 ? "black" : "red";
    const isWin = selection === color;
    const multiplier = color === "green" ? 14 : 2;

    return {
      title: `${color.toUpperCase()} ${pocket}`,
      multiplier: isWin ? multiplier : 0,
      details: { pocket, color, selection }
    };
  }

  if (gameType === "limbo") {
    const targetMultiplier = Number(payload.targetMultiplier || 2);
    const rolledMultiplier = Number((1 + rawValue * 9).toFixed(2));
    const isWin = rolledMultiplier >= targetMultiplier;

    return {
      title: isWin ? "Target Cleared" : "Target Missed",
      multiplier: isWin ? targetMultiplier : 0,
      details: { rolledMultiplier, targetMultiplier }
    };
  }

  if (gameType === "plinko") {
    const buckets = [0.2, 0.5, 0.8, 1, 1.4, 2, 4, 2, 1.4, 1, 0.8, 0.5, 0.2];
    const slot = Math.floor(rawValue * buckets.length);
    const multiplier = buckets[slot];

    return {
      title: `Bucket ${slot + 1}`,
      multiplier,
      details: { slot: slot + 1 }
    };
  }

  if (gameType === "cases") {
    const rewards = [
      { label: "Dirt", rarity: "common", multiplier: 0.6, image: "/images/case-dirt.png" },
      { label: "Gilded", rarity: "rare", multiplier: 1.8, image: "/images/case-gilded.png" },
      { label: "Netherite", rarity: "red", multiplier: 3.2, image: "/images/case-netherite.png" },
      { label: "Elytra", rarity: "legendary", multiplier: 5, image: "/images/case-elytra.png" }
    ];
    const reward = rewards[Math.floor(rawValue * rewards.length)];

    return {
      title: `${reward.rarity.toUpperCase()} DROP`,
      multiplier: reward.multiplier,
      details: {
        reward: reward.label,
        rarity: reward.rarity,
        image: reward.image
      }
    };
  }

  if (gameType === "case-battles") {
    const opponentScore = Number((1 + ((rawValue * 19) % 1) * 9).toFixed(2));
    const yourScore = Number((1 + rawValue * 9).toFixed(2));
    const isWin = yourScore > opponentScore;

    return {
      title: isWin ? "You Won The Battle" : "Battle Lost",
      multiplier: isWin ? 2.3 : 0,
      details: { yourScore, opponentScore }
    };
  }

  if (gameType === "chicken") {
    const steps = 1 + Math.floor(rawValue * 6);
    const cashedMultiplier = Number((1 + steps * 0.35).toFixed(2));
    const isWin = steps >= 3;

    return {
      title: isWin ? "Chicken Escaped" : "Chicken Flattened",
      multiplier: isWin ? cashedMultiplier : 0,
      details: { steps }
    };
  }

  throw createError("Unsupported game type.");
}

router.use(authMiddleware);

router.post("/play", async (req, res, next) => {
  try {
    const gameType = String(req.body.gameType || "").trim();
    const bet = ensurePositiveBet(req.body.bet, req.user.balance);
    const fair = createFairContext(req.user, req.body.clientSeed);
    const fairness = generateDiceResult(fair);
    const outcome = resolveInstantResult(gameType, fairness.value, req.body);
    const payout = Number((bet * outcome.multiplier).toFixed(2));

    req.user.balance = Number((req.user.balance - bet + payout).toFixed(2));
    req.user.clientSeed = fair.clientSeed;
    req.user.nonce += 1;

    pushRecentGame({
      _id: `${gameType}_${Date.now()}`,
      userId: req.user.id,
      gameType,
      betAmount: bet,
      profit: Number((payout - bet).toFixed(2)),
      status: payout > bet ? "won" : payout === bet ? "push" : "lost"
    });

    await persistUsers();

    return res.status(201).json({
      balance: req.user.balance,
      game: {
        gameType,
        bet,
        payout,
        title: outcome.title,
        details: outcome.details,
        multiplier: outcome.multiplier,
        provablyFair: {
          hash: fairness.hash,
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
