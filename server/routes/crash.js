import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getIo } from "../socket.js";
import {
  nextGameId,
  persistUsers,
  pushRecentGame,
  recordHouseStats,
  store
} from "../state/store.js";
import { createServerSeed, createServerSeedHash, hashToFloat } from "../utils/provablyFair.js";
import { createError, ensurePositiveBet } from "../utils/helpers.js";

const router = Router();

const CRASH_HOUSE_EDGE = 0.8;
const COUNTDOWN_MS = 8_000;
const POST_CRASH_MS = 4_500;
const TICK_MS = 150;
const MAX_CRASH_POINT = 1_000;
const GROWTH_RATE = 0.18;

function getCrashStore() {
  return store.crash;
}

function getCurrentMultiplier(round, now = Date.now()) {
  if (!round?.startedAt) {
    return 1;
  }

  const elapsedSeconds = Math.max(0, now - round.startedAt) / 1000;
  const multiplier = Math.exp(GROWTH_RATE * elapsedSeconds);
  return Number(Math.max(1, multiplier).toFixed(2));
}

function getCrashPoint(roundNumber) {
  const serverSeed = createServerSeed();
  const serverSeedHash = createServerSeedHash(serverSeed);
  const { hash, value } = hashToFloat(serverSeed, "donutdrop-crash", roundNumber);
  const rawPoint = CRASH_HOUSE_EDGE / Math.max(0.000001, 1 - value);
  const crashPoint = Number(Math.min(MAX_CRASH_POINT, Math.max(1, rawPoint)).toFixed(2));

  return {
    serverSeed,
    serverSeedHash,
    hash,
    crashPoint
  };
}

function serializePlayer(player, userId) {
  return {
    userId: player.userId,
    username: player.username,
    bet: player.bet,
    status: player.cashedOut ? "cashed" : player.resolved ? "lost" : "active",
    payout: player.payout || 0,
    cashoutMultiplier: player.cashoutMultiplier || 0,
    isYou: player.userId === userId
  };
}

function serializeCrashRound(round, userId) {
  if (!round) {
    return {
      roundId: "",
      status: "idle",
      multiplier: 1,
      bettingClosesAt: 0,
      startedAt: 0,
      crashedAt: 0,
      crashPoint: null,
      history: [],
      players: [],
      playerCount: 0,
      totalBet: 0,
      activeBet: null
    };
  }

  const players = Array.from(round.players.values()).map((player) => serializePlayer(player, userId));
  const activeBet = userId ? players.find((player) => player.userId === userId) || null : null;

  return {
    roundId: round.roundId,
    status: round.status,
    multiplier: round.multiplier,
    bettingClosesAt: round.bettingClosesAt,
    startedAt: round.startedAt,
    crashedAt: round.crashedAt,
    crashPoint: round.status === "crashed" ? round.crashPoint : null,
    history: round.history.slice(-120),
    players,
    playerCount: players.length,
    totalBet: Number(Array.from(round.players.values()).reduce((sum, player) => sum + player.bet, 0).toFixed(2)),
    activeBet
  };
}

function emitCrashState() {
  const io = getIo();
  if (!io) {
    return;
  }

  io.emit("crash:state", serializeCrashRound(getCrashStore().currentRound));
}

async function settleCrashRound(round) {
  const losses = [];
  let totalPayout = 0;
  let totalBet = 0;

  for (const player of round.players.values()) {
    totalBet += Number(player.bet || 0);

    if (player.cashedOut) {
      totalPayout += Number(player.payout || 0);
      continue;
    }

    const user = store.users.get(player.userId);
    if (!user) {
      continue;
    }

    player.resolved = true;
    losses.push({
      _id: player.entryId,
      userId: player.userId,
      gameType: "crash",
      betAmount: player.bet,
      profit: Number((-player.bet).toFixed(2)),
      status: "lost"
    });
  }

  losses.forEach((entry) => pushRecentGame(entry));
  recordHouseStats("crash", totalBet, totalPayout);
  await persistUsers();
}

async function crashCurrentRound() {
  const crashState = getCrashStore();
  const round = crashState.currentRound;

  if (!round || round.status !== "running") {
    return;
  }

  if (crashState.tickInterval) {
    clearInterval(crashState.tickInterval);
    crashState.tickInterval = null;
  }

  round.status = "crashed";
  round.crashedAt = Date.now();
  round.multiplier = round.crashPoint;
  round.history.push(round.crashPoint);
  round.history = round.history.slice(-160);

  await settleCrashRound(round);
  emitCrashState();

  crashState.history.unshift({
    roundId: round.roundId,
    crashPoint: round.crashPoint,
    crashedAt: round.crashedAt
  });
  crashState.history = crashState.history.slice(0, 15);

  crashState.nextRoundTimer = setTimeout(() => {
    startCrashRound().catch((error) => {
      console.error("Failed to start crash round", error);
    });
  }, POST_CRASH_MS);
}

async function startCrashRound() {
  const crashState = getCrashStore();

  if (crashState.tickInterval) {
    clearInterval(crashState.tickInterval);
    crashState.tickInterval = null;
  }

  if (crashState.nextRoundTimer) {
    clearTimeout(crashState.nextRoundTimer);
    crashState.nextRoundTimer = null;
  }

  crashState.roundNumber += 1;
  const fair = getCrashPoint(crashState.roundNumber);
  const roundId = nextGameId("crashround");
  const startedAt = Date.now() + COUNTDOWN_MS;
  const bettingClosesAt = startedAt;

  crashState.currentRound = {
    roundId,
    status: "countdown",
    startedAt,
    bettingClosesAt,
    crashedAt: 0,
    multiplier: 1,
    crashPoint: fair.crashPoint,
    serverSeed: fair.serverSeed,
    serverSeedHash: fair.serverSeedHash,
    hash: fair.hash,
    players: new Map(),
    history: [1]
  };

  emitCrashState();

  crashState.nextRoundTimer = setTimeout(() => {
    const round = crashState.currentRound;
    if (!round || round.roundId !== roundId) {
      return;
    }

    round.status = "running";
    round.startedAt = Date.now();
    round.multiplier = 1;
    round.history = [1];
    emitCrashState();

    crashState.tickInterval = setInterval(() => {
      const activeRound = crashState.currentRound;
      if (!activeRound || activeRound.roundId !== roundId || activeRound.status !== "running") {
        return;
      }

      activeRound.multiplier = getCurrentMultiplier(activeRound);
      activeRound.history.push(activeRound.multiplier);
      activeRound.history = activeRound.history.slice(-160);
      emitCrashState();

      if (activeRound.multiplier >= activeRound.crashPoint) {
        crashCurrentRound().catch((error) => {
          console.error("Failed to settle crash round", error);
        });
      }
    }, TICK_MS);
  }, COUNTDOWN_MS);
}

function requireCrashRound() {
  const round = getCrashStore().currentRound;

  if (!round) {
    throw createError("Crash is warming up. Try again in a second.", 503);
  }

  return round;
}

router.use(authMiddleware);

router.get("/state", (req, res) => {
  res.json({
    round: serializeCrashRound(getCrashStore().currentRound, req.user.id),
    history: getCrashStore().history
  });
});

router.post("/bet", async (req, res, next) => {
  try {
    const round = requireCrashRound();

    if (round.status !== "countdown" || Date.now() >= round.bettingClosesAt) {
      throw createError("Betting is closed for this crash round.", 400);
    }

    if (round.players.has(req.user.id)) {
      throw createError("You already joined this crash round.", 409);
    }

    const bet = ensurePositiveBet(req.body.bet, req.user.balance);
    const entryId = nextGameId("crash");

    req.user.balance = Number((req.user.balance - bet).toFixed(2));
    round.players.set(req.user.id, {
      entryId,
      userId: req.user.id,
      username: req.user.username,
      bet,
      payout: 0,
      cashedOut: false,
      cashoutMultiplier: 0,
      resolved: false
    });

    await persistUsers();
    emitCrashState();

    return res.status(201).json({
      balance: req.user.balance,
      round: serializeCrashRound(round, req.user.id)
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/cashout", async (req, res, next) => {
  try {
    const round = requireCrashRound();

    if (round.status !== "running") {
      throw createError("Crash is not live right now.", 400);
    }

    const player = round.players.get(req.user.id);

    if (!player) {
      throw createError("You are not in this crash round.", 404);
    }

    if (player.cashedOut) {
      throw createError("You already cashed out.", 409);
    }

    const multiplier = Math.min(getCurrentMultiplier(round), round.crashPoint);
    const payout = Number((player.bet * multiplier).toFixed(2));

    player.cashedOut = true;
    player.cashoutMultiplier = multiplier;
    player.payout = payout;
    req.user.balance = Number((req.user.balance + payout).toFixed(2));

    pushRecentGame({
      _id: player.entryId,
      userId: req.user.id,
      gameType: "crash",
      betAmount: player.bet,
      profit: Number((payout - player.bet).toFixed(2)),
      status: "won"
    });

    await persistUsers();
    emitCrashState();

    return res.json({
      balance: req.user.balance,
      payout,
      multiplier,
      round: serializeCrashRound(round, req.user.id)
    });
  } catch (error) {
    return next(error);
  }
});

export function initializeCrashEngine() {
  if (!getCrashStore().currentRound) {
    startCrashRound().catch((error) => {
      console.error("Failed to initialize crash engine", error);
    });
  }
}

export default router;
