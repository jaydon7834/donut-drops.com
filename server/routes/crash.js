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
const COUNTDOWN_MS = 5_000;
const POST_CRASH_MS = 4_500;
const TICK_MS = 100;
const MAX_CRASH_POINT = 1_000;
const GROWTH_RATE = 0.115;
const MIN_AUTO_CASHOUT = 1.01;
const CRASH_BOT_NAMES = [
  "cam",
  "arxhive",
  ".arminal",
  "vextorian",
  "farex",
  "i_killed_pedro1",
  "axtro2",
  "wer",
  "jvcob",
  "skellicuh",
  "casino800m"
];
const CRASH_BOT_BETS = [10, 20, 35, 50, 75, 100, 150, 200, 250, 500, 1_000, 2_500, 5_000, 10_000];

function getCrashStore() {
  return store.crash;
}

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function pickCrashBotBet() {
  return CRASH_BOT_BETS[Math.floor(Math.random() * CRASH_BOT_BETS.length)];
}

function sanitizeAutoCashout(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < MIN_AUTO_CASHOUT) {
    throw createError(`Auto cashout must be at least ${MIN_AUTO_CASHOUT.toFixed(2)}x.`);
  }

  return Number(parsed.toFixed(2));
}

function getCrashBotCashoutTarget(crashPoint) {
  const roll = Math.random();

  if (roll < 0.24) {
    return null;
  }

  const target = crashPoint * (0.62 + Math.random() * 0.24);
  return Number(Math.max(MIN_AUTO_CASHOUT, Math.min(target, crashPoint - 0.02)).toFixed(2));
}

function createCrashBots(roundId, crashPoint) {
  const botCount = 5 + Math.floor(Math.random() * 6);
  const names = shuffle(CRASH_BOT_NAMES).slice(0, botCount);

  return names.map((username, index) => {
    const bet = pickCrashBotBet();

    return {
      entryId: nextGameId("crashbot"),
      userId: `crash_bot_${roundId}_${index + 1}`,
      username,
      bet,
      autoCashout: getCrashBotCashoutTarget(crashPoint),
      payout: 0,
      cashedOut: false,
      cashoutMultiplier: 0,
      resolved: false,
      isBot: true
    };
  });
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
    entryId: player.entryId,
    userId: player.userId,
    username: player.username,
    bet: player.bet,
    autoCashout: player.autoCashout || null,
    status: player.cashedOut ? "cashed" : player.resolved ? "lost" : "active",
    payout: player.payout || 0,
    cashoutMultiplier: player.cashoutMultiplier || 0,
    isBot: Boolean(player.isBot),
    isYou: player.userId === userId
  };
}

function serializeCrashRound(round, userId) {
  const crashState = getCrashStore();

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
      activeBets: [],
      queuedBets: [],
      queueCount: 0,
      queueTotal: 0
    };
  }

  const players = Array.from(round.players.values()).map((player) => serializePlayer(player, userId));
  const activeBets = userId ? players.filter((player) => player.userId === userId) : [];
  const queuedBets = userId
    ? crashState.pendingEntries
        .filter((player) => player.userId === userId)
        .map((player) => ({
          entryId: player.entryId,
          userId: player.userId,
          username: player.username,
          bet: player.bet,
          autoCashout: player.autoCashout || null,
          status: "queued",
          payout: 0,
          cashoutMultiplier: 0,
          isBot: false,
          isYou: true
        }))
    : [];

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
    totalBet: Number(
      Array.from(round.players.values()).reduce((sum, player) => sum + Number(player.bet || 0), 0).toFixed(2)
    ),
    activeBets,
    queuedBets,
    queueCount: crashState.pendingEntries.length,
    queueTotal: Number(
      crashState.pendingEntries.reduce((sum, player) => sum + Number(player.bet || 0), 0).toFixed(2)
    )
  };
}

function emitCrashState() {
  const io = getIo();
  if (!io) {
    return;
  }

  io.emit("crash:state", serializeCrashRound(getCrashStore().currentRound));
}

function settlePlayerWin(player, multiplier) {
  const safeMultiplier = Number(multiplier.toFixed(2));
  player.cashedOut = true;
  player.cashoutMultiplier = safeMultiplier;
  player.payout = Number((player.bet * safeMultiplier).toFixed(2));

  if (player.isBot) {
    return;
  }

  const user = store.users.get(player.userId);
  if (!user) {
    return;
  }

  user.balance = Number((user.balance + player.payout).toFixed(2));
  pushRecentGame({
    _id: player.entryId,
    userId: player.userId,
    gameType: "crash",
    betAmount: player.bet,
    profit: Number((player.payout - player.bet).toFixed(2)),
    status: "won"
  });
}

async function settleCrashRound(round) {
  const losses = [];
  let totalPayout = 0;
  let totalBet = 0;

  for (const player of round.players.values()) {
    if (player.isBot) {
      continue;
    }

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

function processAutoCashouts(round) {
  let changed = false;

  for (const player of round.players.values()) {
    if (player.cashedOut || player.resolved || !player.autoCashout) {
      continue;
    }

    if (round.multiplier >= player.autoCashout && player.autoCashout < round.crashPoint) {
      settlePlayerWin(player, player.autoCashout);
      changed = true;
    }
  }

  return changed;
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
  const bettingClosesAt = Date.now() + COUNTDOWN_MS;

  crashState.currentRound = {
    roundId,
    status: "countdown",
    startedAt: 0,
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

  createCrashBots(roundId, fair.crashPoint).forEach((bot) => {
    crashState.currentRound.players.set(bot.entryId, bot);
  });

  crashState.pendingEntries.forEach((entry) => {
    crashState.currentRound.players.set(entry.entryId, {
      ...entry,
      resolved: false,
      cashedOut: false,
      payout: 0,
      cashoutMultiplier: 0
    });
  });
  crashState.pendingEntries = [];

  emitCrashState();

  crashState.nextRoundTimer = setTimeout(() => {
    const activeRound = crashState.currentRound;
    if (!activeRound || activeRound.roundId !== roundId) {
      return;
    }

    activeRound.status = "running";
    activeRound.startedAt = Date.now();
    activeRound.bettingClosesAt = activeRound.startedAt;
    activeRound.multiplier = 1;
    activeRound.history = [1];
    emitCrashState();

    crashState.tickInterval = setInterval(() => {
      const runningRound = crashState.currentRound;
      if (!runningRound || runningRound.roundId !== roundId || runningRound.status !== "running") {
        return;
      }

      runningRound.multiplier = getCurrentMultiplier(runningRound);
      runningRound.history.push(runningRound.multiplier);
      runningRound.history = runningRound.history.slice(-160);

      const autoChanged = processAutoCashouts(runningRound);
      if (autoChanged) {
        persistUsers().catch((error) => {
          console.error("Failed to persist auto cashout state", error);
        });
      }

      emitCrashState();

      if (runningRound.multiplier >= runningRound.crashPoint) {
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
    const crashState = getCrashStore();

    const bet = ensurePositiveBet(req.body.bet, req.user.balance);
    const autoCashout = sanitizeAutoCashout(req.body.autoCashout);
    const entryId = nextGameId("crash");

    req.user.balance = Number((req.user.balance - bet).toFixed(2));
    const entry = {
      entryId,
      userId: req.user.id,
      username: req.user.username,
      bet,
      autoCashout,
      payout: 0,
      cashedOut: false,
      cashoutMultiplier: 0,
      resolved: false,
      isBot: false
    };

    if (round.status === "countdown") {
      round.players.set(entryId, entry);
    } else {
      crashState.pendingEntries.push(entry);
    }

    await persistUsers();
    emitCrashState();

    return res.status(201).json({
      balance: req.user.balance,
      joinedRoundId: round.roundId,
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

    const entryId = String(req.body.entryId || "");
    const player = round.players.get(entryId);

    if (!player || player.userId !== req.user.id) {
      throw createError("That crash bet is not yours.", 404);
    }

    if (player.cashedOut) {
      throw createError("You already cashed out this bet.", 409);
    }

    if (player.resolved) {
      throw createError("This crash bet has already ended.", 409);
    }

    const multiplier = Math.min(getCurrentMultiplier(round), round.crashPoint);
    settlePlayerWin(player, multiplier);

    await persistUsers();
    emitCrashState();

    return res.json({
      balance: req.user.balance,
      payout: player.payout,
      multiplier: player.cashoutMultiplier,
      entryId: player.entryId,
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
