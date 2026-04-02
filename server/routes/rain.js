import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { store } from "../state/store.js";
import { createError, isAdminUser } from "../utils/helpers.js";
import { getIo } from "../socket.js";

const router = Router();
const RAIN_DURATION_MS = 3 * 60 * 1000;
const MIN_RAIN_INTERVAL_MS = 30 * 60 * 1000;
const MAX_RAIN_INTERVAL_MS = 60 * 60 * 1000;

function canManageRain(user) {
  const envList = String(process.env.RAIN_ADMIN_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (envList.length > 0) {
    return envList.includes(String(user.id));
  }

  return isAdminUser(user);
}

function getRainAmount() {
  const presets = [
    500_000,
    750_000,
    1_000_000,
    1_500_000,
    2_000_000,
    2_500_000,
    5_000_000,
    7_500_000,
    10_000_000
  ];

  return presets[Math.floor(Math.random() * presets.length)];
}

function normalizeRainAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw createError("Rain amount must be greater than 0.");
  }

  return Number(amount.toFixed(2));
}

function serializeRain(user) {
  return {
    active: store.rain.active,
    amount: store.rain.amount,
    participants: store.rain.participants.length,
    endTime: store.rain.endTime,
    nextStartAt: store.rain.nextStartAt,
    canStart: user ? canManageRain(user) : false
  };
}

function getNextRainDelay() {
  return MIN_RAIN_INTERVAL_MS + Math.floor(Math.random() * (MAX_RAIN_INTERVAL_MS - MIN_RAIN_INTERVAL_MS + 1));
}

function scheduleNextRain() {
  if (store.rain.timer || store.rain.active) {
    return;
  }

  if (store.rain.nextTimer) {
    clearTimeout(store.rain.nextTimer);
  }

  const delay = getNextRainDelay();
  store.rain.nextStartAt = Date.now() + delay;
  store.rain.nextTimer = setTimeout(() => {
    store.rain.nextTimer = null;
    store.rain.nextStartAt = 0;
    startRain();
  }, delay);
}

function broadcastChatRainMessage(message) {
  const io = getIo();

  if (!io) {
    return;
  }

  io.emit("chat:message", {
    type: "rain",
    message
  });
}

function endRain() {
  const io = getIo();
  const participantCount = store.rain.participants.length;

  store.rain.active = false;
  store.rain.amount = 0;
  store.rain.endTime = 0;
  store.rain.participants = [];

  if (store.rain.timer) {
    clearTimeout(store.rain.timer);
    store.rain.timer = null;
  }

  store.rain.nextStartAt = 0;

  if (io) {
    io.emit("rain:end", {
      participants: participantCount
    });
  }

  scheduleNextRain();
}

function startRain(amountOverride = null) {
  const io = getIo();

  store.rain.active = true;
  store.rain.amount = amountOverride == null ? getRainAmount() : normalizeRainAmount(amountOverride);
  store.rain.participants = [];
  store.rain.endTime = Date.now() + RAIN_DURATION_MS;
  store.rain.nextStartAt = 0;

  if (store.rain.nextTimer) {
    clearTimeout(store.rain.nextTimer);
    store.rain.nextTimer = null;
  }

  if (store.rain.timer) {
    clearTimeout(store.rain.timer);
  }

  store.rain.timer = setTimeout(endRain, RAIN_DURATION_MS);

  if (io) {
    io.emit("rain:start", {
      amount: store.rain.amount,
      endTime: store.rain.endTime
    });
  }

  broadcastChatRainMessage("RAIN STARTED - JOIN NOW!");
}

export function initializeRainScheduler() {
  if (!store.rain.active && !store.rain.nextTimer) {
    scheduleNextRain();
  }
}

router.use(authMiddleware);

router.get("/", (req, res) => {
  return res.json({
    rain: serializeRain(req.user)
  });
});

router.post("/start", (req, res, next) => {
  try {
    if (!canManageRain(req.user)) {
      throw createError("Only staff can start rain events.", 403);
    }

    if (store.rain.active) {
      throw createError("Rain is already active.");
    }

    startRain(req.body.amount ?? null);

    return res.status(201).json({
      rain: serializeRain(req.user)
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/join", (req, res, next) => {
  try {
    if (!store.rain.active) {
      throw createError("No rain is active right now.");
    }

    if (store.rain.participants.includes(req.user.id)) {
      throw createError("You already joined this rain.");
    }

    store.rain.participants.push(req.user.id);
    const io = getIo();

    if (io) {
      io.emit("rain:update", {
        count: store.rain.participants.length
      });
    }

    return res.json({
      success: true,
      rain: serializeRain(req.user)
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
