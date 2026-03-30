import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { store } from "../state/store.js";
import { createError } from "../utils/helpers.js";
import { getIo } from "../socket.js";

const router = Router();
const RAIN_DURATION_MS = 10 * 60 * 1000;

function canManageRain(user) {
  const envList = String(process.env.RAIN_ADMIN_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (envList.length > 0) {
    return envList.includes(String(user.id));
  }

  const firstUserId = store.users.keys().next().value;
  return Boolean(firstUserId) && firstUserId === user.id;
}

function getRainAmount() {
  return 5_000 + Math.floor(Math.random() * 20_000);
}

function serializeRain(user) {
  return {
    active: store.rain.active,
    amount: store.rain.amount,
    participants: store.rain.participants.length,
    endTime: store.rain.endTime,
    canStart: user ? canManageRain(user) : false
  };
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

  if (io) {
    io.emit("rain:end", {
      participants: participantCount
    });
  }
}

function startRain() {
  const io = getIo();

  store.rain.active = true;
  store.rain.amount = getRainAmount();
  store.rain.participants = [];
  store.rain.endTime = Date.now() + RAIN_DURATION_MS;

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

    startRain();

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
