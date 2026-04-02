import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { createError } from "../utils/helpers.js";
import { getChatMessages, store } from "../state/store.js";
import { getIo } from "../socket.js";

const router = Router();
const SPAM_LIMIT = 5;
const TIMEOUT_MS = 3 * 60 * 1000;
const ADMIN_USERS = new Set(["wer", "jaydon", "admin"]);
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

function canModerate(user) {
  return ADMIN_USERS.has(String(user?.username || "").toLowerCase());
}

function findTargetUser(username) {
  return Array.from(store.users.values()).find(
    (user) => String(user.username || "").toLowerCase() === String(username || "").trim().toLowerCase()
  );
}

function applyChatModeration(target, action, durationSeconds = 0) {
  if (action === "unmute" || action === "untimeout") {
    store.chatTimeouts.delete(target.id);
    addFlag(target, `[MOD ACTION] ${action}`, `admin ${action}`);
    return { target: target.username, durationSeconds: 0 };
  }

  const durations = {
    mute: Math.max(durationSeconds || 300, 60),
    timeout: Math.max(durationSeconds || 300, 60),
    kick: 15 * 60,
    shadowmute: 60 * 60,
    ban: 24 * 60 * 60
  };
  const duration = durations[action];

  if (!duration) {
    throw createError("Unsupported moderation action.");
  }

  store.chatTimeouts.set(target.id, Date.now() + duration * 1000);
  addFlag(target, `[MOD ACTION] ${action}`, `admin ${action}`);
  return { target: target.username, durationSeconds: duration };
}

function parseModerationCommand(text) {
  const match = String(text || "")
    .trim()
    .match(/^\/(timeout|mute|kick|ban|shadowmute|untimeout|unmute)\s+([A-Za-z0-9_]+)(?:\s+(\d+))?$/i);

  if (!match) {
    return null;
  }

  return {
    action: match[1].toLowerCase(),
    username: match[2],
    durationSeconds: Number(match[3] || 0)
  };
}

function addFlag(user, text, reason) {
  store.chatFlags.unshift({
    id: `flag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    username: user.username,
    userId: user.id,
    text,
    reason,
    createdAt: new Date().toISOString()
  });
  store.chatFlags = store.chatFlags.slice(0, 20);
}

router.use(authMiddleware);

router.get("/", (req, res) => {
  const timeoutUntil = store.chatTimeouts.get(req.user.id) || 0;

  return res.json({
    messages: getChatMessages(),
    timeoutUntil,
    canModerate: canModerate(req.user),
    flaggedMessages: canModerate(req.user) ? store.chatFlags.slice(0, 10) : [],
    customWords: canModerate(req.user) ? store.chatCustomWords : []
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

    const command = parseModerationCommand(text);
    if (command) {
      if (!canModerate(req.user)) {
        throw createError("You do not have permission to run moderation commands.", 403);
      }

      const target = findTargetUser(command.username);
      if (!target) {
        throw createError("Player not found.", 404);
      }

      const result = applyChatModeration(target, command.action, command.durationSeconds);

      return res.status(201).json({
        messages: getChatMessages(),
        timeoutUntil: 0,
        canModerate: true,
        flaggedMessages: store.chatFlags.slice(0, 10),
        customWords: store.chatCustomWords,
        systemMessage:
          result.durationSeconds > 0
            ? `${result.target} ${command.action} applied for ${Math.ceil(result.durationSeconds / 60)} minutes.`
            : `${result.target} ${command.action} applied.`
      });
    }

    const moderation = analyzeMessage(text);

    if (moderation) {
      const timeoutUntil = Date.now() + moderation.timeoutMs;
      store.chatTimeouts.set(req.user.id, timeoutUntil);
      addFlag(req.user, text, moderation.label);

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
      addFlag(req.user, text, "spam");

      throw createError("Timed out for 3 minutes for spam. Your recent messages were removed.", 429);
    }

    const matchedWord = store.chatCustomWords.find((word) =>
      normalizedText.includes(String(word || "").toLowerCase())
    );

    if (matchedWord) {
      const timeoutUntil = Date.now() + 60 * 60 * 1000;
      store.chatTimeouts.set(req.user.id, timeoutUntil);
      addFlag(req.user, text, `custom word: ${matchedWord}`);
      throw createError("Timed out for 60 minutes for restricted language.", 429);
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
      timeoutUntil: 0,
      canModerate: canModerate(req.user),
      flaggedMessages: canModerate(req.user) ? store.chatFlags.slice(0, 10) : [],
      customWords: canModerate(req.user) ? store.chatCustomWords : []
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/moderate", (req, res, next) => {
  try {
    if (!canModerate(req.user)) {
      throw createError("You do not have permission to moderate chat.", 403);
    }

    const username = String(req.body.username || "").trim();
    const action = String(req.body.action || "").trim().toLowerCase();
    const durationSeconds = Number(req.body.durationSeconds || 0);
    const target = findTargetUser(username);

    if (!target) {
      throw createError("Player not found.", 404);
    }

    applyChatModeration(target, action, durationSeconds);

    return res.json({
      target: target.username,
      flaggedMessages: store.chatFlags.slice(0, 10),
      customWords: store.chatCustomWords
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/words", (req, res, next) => {
  try {
    if (!canModerate(req.user)) {
      throw createError("You do not have permission to edit chat words.", 403);
    }

    const word = String(req.body.word || "").trim().toLowerCase();

    if (!word) {
      throw createError("Word is required.");
    }

    if (!store.chatCustomWords.includes(word)) {
      store.chatCustomWords.push(word);
      store.chatCustomWords.sort();
    }

    return res.json({ words: store.chatCustomWords });
  } catch (error) {
    return next(error);
  }
});

router.delete("/words/:word", (req, res, next) => {
  try {
    if (!canModerate(req.user)) {
      throw createError("You do not have permission to edit chat words.", 403);
    }

    const word = String(req.params.word || "").trim().toLowerCase();
    store.chatCustomWords = store.chatCustomWords.filter((entry) => entry !== word);

    return res.json({ words: store.chatCustomWords });
  } catch (error) {
    return next(error);
  }
});

export default router;
