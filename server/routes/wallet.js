import crypto from "crypto";
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { persistUsers, store } from "../state/store.js";
import { createError, sanitizeUser } from "../utils/helpers.js";

const router = Router();
const BOT_SECRET = process.env.MINECRAFT_BOT_SECRET || "donutdrop-bot-secret";

function randomDepositCode() {
  return String(crypto.randomInt(100, 1000));
}

function nextDepositId() {
  return `deposit_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
}

router.post("/deposit/confirm", async (req, res, next) => {
  try {
    const secret = req.headers["x-bot-secret"];

    if (secret !== BOT_SECRET) {
      throw createError("Unauthorized bot confirmation.", 401);
    }

    const minecraftUsername = String(req.body.minecraftUsername || "").trim();
    const code = String(req.body.code || "").trim();
    const amount = Number(req.body.amount);

    if (!minecraftUsername || !code) {
      throw createError("Minecraft username and code are required.");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw createError("Amount must be greater than 0.");
    }

    const session = Array.from(store.pendingDeposits.values()).find(
      (entry) =>
        entry.status === "pending" &&
        entry.code === code &&
        entry.minecraftUsername.toLowerCase() === minecraftUsername.toLowerCase()
    );

    if (!session) {
      throw createError("Pending deposit session not found.", 404);
    }

    const user = store.users.get(session.userId);

    if (!user) {
      throw createError("Deposit user not found.", 404);
    }

    session.status = "completed";
    session.amount = Number(amount.toFixed(2));
    session.completedAt = new Date().toISOString();
    user.balance = Number((user.balance + session.amount).toFixed(2));

    await persistUsers();

    return res.json({
      ok: true,
      depositId: session.id,
      amount: session.amount,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return next(error);
  }
});

router.use(authMiddleware);

router.patch("/minecraft/link", async (req, res, next) => {
  try {
    const minecraftUsername = String(req.body.minecraftUsername || "").trim();

    if (!minecraftUsername) {
      throw createError("Minecraft username is required.");
    }

    req.user.minecraftUsername = minecraftUsername.slice(0, 32);
    await persistUsers();

    return res.json({
      user: sanitizeUser(req.user)
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/deposit/session", (req, res, next) => {
  try {
    if (!req.user.minecraftUsername) {
      throw createError("Link your Minecraft account first.");
    }

    const existingSession = Array.from(store.pendingDeposits.values()).find(
      (entry) => entry.userId === req.user.id && entry.status === "pending"
    );

    if (existingSession) {
      return res.json({ session: existingSession });
    }

    const session = {
      id: nextDepositId(),
      userId: req.user.id,
      minecraftUsername: req.user.minecraftUsername,
      code: randomDepositCode(),
      status: "pending",
      createdAt: new Date().toISOString(),
      amount: 0
    };

    store.pendingDeposits.set(session.id, session);

    return res.status(201).json({ session });
  } catch (error) {
    return next(error);
  }
});

router.get("/deposit/session/:sessionId", (req, res, next) => {
  try {
    const session = store.pendingDeposits.get(String(req.params.sessionId || ""));

    if (!session || session.userId !== req.user.id) {
      throw createError("Deposit session not found.", 404);
    }

    return res.json({ session });
  } catch (error) {
    return next(error);
  }
});

export default router;
