import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { createError } from "../utils/helpers.js";
import { getChatMessages, store } from "../state/store.js";

const router = Router();
const SPAM_LIMIT = 5;
const TIMEOUT_MS = 3 * 60 * 1000;

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
    store.chatMessages = store.chatMessages.slice(-60);

    return res.status(201).json({
      messages: getChatMessages(),
      timeoutUntil: 0
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
