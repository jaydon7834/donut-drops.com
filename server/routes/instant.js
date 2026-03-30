import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  nextGameId,
  persistUsers,
  pushRecentGame,
  recordHouseStats,
  store
} from "../state/store.js";
import { emitToUser, getIo } from "../socket.js";
import { createFairContext, generateDiceResult } from "../utils/provablyFair.js";
import { createError, ensurePositiveBet } from "../utils/helpers.js";

const router = Router();

const CASE_REWARDS = [
  {
    label: "Dirt",
    rarity: "common",
    multiplier: 0.6,
    image: "/images/case-dirt.png",
    weight: 0.62
  },
  {
    label: "Gilded",
    rarity: "rare",
    multiplier: 1.8,
    image: "/images/case-gilded.png",
    weight: 0.24
  },
  {
    label: "Netherite",
    rarity: "red",
    multiplier: 3.2,
    image: "/images/case-netherite.png",
    weight: 0.1
  },
  {
    label: "Elytra",
    rarity: "legendary",
    multiplier: 5,
    image: "/images/case-elytra.png",
    weight: 0.04
  }
];

function getCaseReward(rawValue) {
  let cursor = 0;

  for (const [index, reward] of CASE_REWARDS.entries()) {
    cursor += reward.weight;

    if (rawValue < cursor) {
      return {
        ...reward,
        index
      };
    }
  }

  return {
    ...CASE_REWARDS[CASE_REWARDS.length - 1],
    index: CASE_REWARDS.length - 1
  };
}

function serializeOpenBattle(battle) {
  return {
    id: battle.id,
    bet: battle.bet,
    createdAt: battle.createdAt,
    host: {
      id: battle.host.id,
      username: battle.host.username
    }
  };
}

function broadcastOpenBattles() {
  const io = getIo();

  if (!io) {
    return;
  }

  const battles = Array.from(store.caseBattles.values())
    .filter((battle) => battle.status === "waiting")
    .map(serializeOpenBattle);

  io.emit("case-battles:update", {
    battles
  });
}

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
    const reward = getCaseReward(rawValue);

    return {
      title: `${reward.rarity.toUpperCase()} DROP`,
      multiplier: reward.multiplier,
      details: {
        reward: reward.label,
        rarity: reward.rarity,
        image: reward.image,
        rewardIndex: reward.index
      }
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

function rollCaseBattleDrop(user, clientSeedInput) {
  const fair = createFairContext(user, clientSeedInput);
  const fairness = generateDiceResult(fair);
  const reward = getCaseReward(fairness.value);

  user.clientSeed = fair.clientSeed;
  user.nonce += 1;

  return {
    reward,
    fairness,
    fair
  };
}

router.use(authMiddleware);

router.get("/case-battles", (req, res) => {
  const battles = Array.from(store.caseBattles.values())
    .filter((battle) => battle.status === "waiting")
    .map(serializeOpenBattle);

  return res.json({
    battles
  });
});

router.post("/case-battles", async (req, res, next) => {
  try {
    const bet = ensurePositiveBet(req.body.bet, req.user.balance);
    const existingBattle = Array.from(store.caseBattles.values()).find(
      (battle) => battle.status === "waiting" && battle.host.id === req.user.id
    );

    if (existingBattle) {
      throw createError("You already have an open battle waiting for a player.");
    }

    req.user.balance = Number((req.user.balance - bet).toFixed(2));

    const battle = {
      id: nextGameId("case_battle"),
      bet,
      createdAt: Date.now(),
      status: "waiting",
      host: {
        id: req.user.id,
        username: req.user.username
      }
    };

    store.caseBattles.set(battle.id, battle);
    await persistUsers();
    broadcastOpenBattles();

    return res.status(201).json({
      battle: serializeOpenBattle(battle),
      balance: req.user.balance
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/case-battles/:battleId/join", async (req, res, next) => {
  try {
    const battle = store.caseBattles.get(String(req.params.battleId || ""));

    if (!battle || battle.status !== "waiting") {
      throw createError("That battle is no longer available.", 404);
    }

    if (battle.host.id === req.user.id) {
      throw createError("You cannot join your own battle.");
    }

    const bet = ensurePositiveBet(battle.bet, req.user.balance);
    const hostUser = store.users.get(battle.host.id);

    if (!hostUser) {
      store.caseBattles.delete(battle.id);
      broadcastOpenBattles();
      throw createError("Battle host is no longer available.", 404);
    }

    req.user.balance = Number((req.user.balance - bet).toFixed(2));

    const hostDrop = rollCaseBattleDrop(hostUser, battle.host.clientSeed);
    const joinerDrop = rollCaseBattleDrop(req.user, req.body.clientSeed);
    const pot = Number((bet * 2).toFixed(2));

    let hostPayout = 0;
    let joinerPayout = 0;
    let winnerId = null;
    let title = "Case Battle Push";

    if (hostDrop.reward.multiplier > joinerDrop.reward.multiplier) {
      hostPayout = pot;
      winnerId = hostUser.id;
      title = `${hostUser.username} won the battle`;
    } else if (joinerDrop.reward.multiplier > hostDrop.reward.multiplier) {
      joinerPayout = pot;
      winnerId = req.user.id;
      title = `${req.user.username} won the battle`;
    } else {
      hostPayout = bet;
      joinerPayout = bet;
    }

    hostUser.balance = Number((hostUser.balance + hostPayout).toFixed(2));
    req.user.balance = Number((req.user.balance + joinerPayout).toFixed(2));

    pushRecentGame({
      _id: battle.id,
      userId: hostUser.id,
      gameType: "case-battles",
      betAmount: bet,
      profit: Number((hostPayout - bet).toFixed(2)),
      status: hostPayout > bet ? "won" : hostPayout === bet ? "push" : "lost"
    });

    pushRecentGame({
      _id: `${battle.id}_joiner`,
      userId: req.user.id,
      gameType: "case-battles",
      betAmount: bet,
      profit: Number((joinerPayout - bet).toFixed(2)),
      status: joinerPayout > bet ? "won" : joinerPayout === bet ? "push" : "lost"
    });

    battle.status = "resolved";
    store.caseBattles.delete(battle.id);
    await persistUsers();
    broadcastOpenBattles();

    const payload = {
      battleId: battle.id,
      title,
      bet,
      pot,
      winnerId,
      players: [
        {
          id: hostUser.id,
          username: hostUser.username,
          payout: hostPayout,
          reward: hostDrop.reward
        },
        {
          id: req.user.id,
          username: req.user.username,
          payout: joinerPayout,
          reward: joinerDrop.reward
        }
      ]
    };

    emitToUser(hostUser.id, "case-battle:resolved", {
      ...payload,
      balance: hostUser.balance
    });
    emitToUser(req.user.id, "case-battle:resolved", {
      ...payload,
      balance: req.user.balance
    });

    return res.json({
      battle: payload,
      balance: req.user.balance
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/play", async (req, res, next) => {
  try {
    const gameType = String(req.body.gameType || "").trim();

    if (gameType === "case-battles") {
      throw createError("Case battles now use the battle lobby.");
    }

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

    recordHouseStats(gameType, bet, payout);
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
