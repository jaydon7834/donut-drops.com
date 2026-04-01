import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { emitToUser } from "../socket.js";
import { findUserByUsername, getRecentGamesForUser, persistUsers, store } from "../state/store.js";
import { createError, sanitizeUser } from "../utils/helpers.js";

const router = Router();

router.use(authMiddleware);

router.get("/balance", (req, res) => {
  res.json({
    user: sanitizeUser(req.user),
    recentGames: getRecentGamesForUser(req.user.id)
  });
});

router.get("/players", (req, res) => {
  const players = Array.from(store.users.values())
    .filter((user) => user.id !== req.user.id)
    .map((user) => ({
      id: user.id,
      username: user.username,
      affiliateCodeUsed: user.affiliateCodeUsed || ""
    }))
    .sort((a, b) => a.username.localeCompare(b.username));

  res.json({ players });
});

router.post("/update-balance", async (req, res) => {
  const nextBalance = Number(req.body.balance);

  if (!Number.isFinite(nextBalance) || nextBalance < 0) {
    return res.status(400).json({ message: "Balance must be a valid non-negative number." });
  }

  req.user.balance = Number(nextBalance.toFixed(2));
  await persistUsers();
  return res.json({
    user: sanitizeUser(req.user)
  });
});

router.patch("/seed", async (req, res) => {
  const clientSeed = String(req.body.clientSeed || "").trim();

  if (!clientSeed) {
    return res.status(400).json({ message: "Client seed is required." });
  }

  req.user.clientSeed = clientSeed.slice(0, 64);
  await persistUsers();

  return res.json({
    user: sanitizeUser(req.user)
  });
});

router.post("/tip", async (req, res, next) => {
  try {
    const recipientUsername = String(req.body.username || "").trim();
    const amount = Number(req.body.amount);

    if (!recipientUsername) {
      throw createError("Recipient username is required.");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw createError("Tip amount must be greater than 0.");
    }

    if (amount > req.user.balance) {
      throw createError("Insufficient balance.");
    }

    const recipient = findUserByUsername(recipientUsername);

    if (!recipient) {
      throw createError("Recipient not found.", 404);
    }

    if (recipient.id === req.user.id) {
      throw createError("You cannot tip yourself.");
    }

    req.user.balance = Number((req.user.balance - amount).toFixed(2));
    recipient.balance = Number((recipient.balance + amount).toFixed(2));
    await persistUsers();

    emitToUser(recipient.id, "chat:message", {
      type: "tip",
      message: {
        id: `tip_${Date.now()}`,
        username: "system",
        text: `✨${req.user.username} has just tipped you $${Number(amount.toFixed(2)).toLocaleString()}.`,
        createdAt: new Date().toISOString()
      }
    });

    return res.json({
      user: sanitizeUser(req.user),
      recipient: sanitizeUser(recipient),
      amount: Number(amount.toFixed(2))
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/affiliate/apply", async (req, res, next) => {
  try {
    const code = String(req.body.code || req.body.affiliateCode || req.body || "")
      .trim()
      .toUpperCase();

    if (!code) {
      throw createError("Affiliate code is required.");
    }

    if (req.user.affiliateCodeUsed) {
      throw createError("An affiliate code has already been applied to this account.");
    }

    const referrer = Array.from(store.users.values()).find(
      (user) => String(user.affiliateCode || user.username || "").toUpperCase() === code
    );

    if (!referrer) {
      throw createError("Invalid affiliate code.");
    }

    if (referrer.id === req.user.id) {
      throw createError("You cannot apply your own affiliate code.");
    }

    req.user.affiliateCodeUsed = code;
    req.user.affiliateRewardGranted = false;
    await persistUsers();

    return res.json({
      user: sanitizeUser(req.user),
      referrer: sanitizeUser(referrer)
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/affiliate/claim", async (req, res) => {
  return res.json({
    user: sanitizeUser(req.user),
    amount: 0,
    message: "Affiliate rewards are credited instantly."
  });
});

export default router;
