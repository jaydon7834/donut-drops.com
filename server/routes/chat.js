import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { createError } from "../utils/helpers.js";
import { getChatMessages, store } from "../state/store.js";
import { getIo } from "../socket.js";

const router = Router();
const SPAM_LIMIT = 5;
const TIMEOUT_MS = 3 * 60 * 1000;
const MODERATION_RULES = [
  { pattern: /\b(kys|kill yourself|go die)\b/i, label: "self-harm harassment", timeoutMs: 24 * 60 * 60 * 1000 },
  { pattern: /\b(nigg(?:a|er)?|fagg?(?:ot)?|retard(?:ed)?)\b/i, label: "hate speech", timeoutMs: 12 * 60 * 60 * 1000 },
  { pattern: /\b(ddos|doxx|swat|rape|pedo|molest)\b/i, label: "extreme abuse", timeoutMs: 6 * 60 * 60 * 1000 },
  { pattern: /\b(fuck you|bitch|whore|slut|cunt|stfu)\b/i, label: "abusive language", timeoutMs: 30 * 60 * 1000 }
];

function analyzeMessage(text) {
  const normalized = String(text || "").trim();
  const uppercaseRatio =
    normalized.replace(/[^A-Z]/g, "").length / Math.max(normalized.replace(/[^A-Za-z]/g, "").length, 1);

  for (const rule of MODERATION_RULES) {
    if (rule.pattern.test(normalized)) {
      return rule;
    }
  }

  if (uppercaseRatio > 0.75 && normalized.length >= 18) {
    return {
      label: "aggressive spam",
      timeoutMs: 10 * 60 * 1000
    };
  }

  return null;
}

router.use(authMiddleware);

router.get("/", (req, res) => {
  const timeoutUntil = store.chatTimeouts.get(req.user.id) || 0;

  return res.json({
    messages: getChatMessages(),
    timeoutUntil
  });
});

router.post("/", (req, res, next) => {
  try {
    const timeoutUntil = store.chatTimeouts.get(req.user.id) || 0;

    if (timeoutUntil > Date.now()) {
      throw createError("You are timed out for spamming. Try again in a few minutes.", 429);
    }

    const text = String(req.body.text || "").trim();

    if (!text) {
      throw createError("Message cannot be empty.");
    }

    if (text.length > 180) {
      throw createError("Message is too long.");
    }

    const moderation = analyzeMessage(text);

    if (moderation) {
      const timeoutUntil = Date.now() + moderation.timeoutMs;
      store.chatTimeouts.set(req.user.id, timeoutUntil);

      throw createError(
        `Timed out for ${Math.ceil(moderation.timeoutMs / 60000)} minutes for ${moderation.label}.`,
        429
      );
    }

    const normalizedText = text.toLowerCase();
    const repeatedMessages = store.chatMessages.filter(
      (message) =>
        message.userId === req.user.id && message.text.toLowerCase() === normalizedText
    );

    if (repeatedMessages.length >= SPAM_LIMIT) {
      store.chatTimeouts.set(req.user.id, Date.now() + TIMEOUT_MS);
      store.chatMessages = store.chatMessages.filter(
        (message) => message.userId !== req.user.id
      );

      throw createError("Timed out for 3 minutes for spam. Your recent messages were removed.", 429);
    }

    const message = {
      id: `chat_${Date.now()}`,
      userId: req.user.id,
      username: req.user.username,
      text,
      createdAt: new Date().toISOString()
    };

    store.chatMessages.push(message);
    if (store.chatMessages.length % 3 === 0) {
      store.chatMessages.shift();
    }
    store.chatMessages = store.chatMessages.slice(-60);

    const io = getIo();
    if (io) {
      io.emit("chat:message", {
        type: "chat",
        message
      });
    }

    return res.status(201).json({
      messages: getChatMessages(),
      timeoutUntil: 0
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
