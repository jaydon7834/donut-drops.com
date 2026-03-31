import { Router } from "express";
import { comparePassword, createError, hashPassword, sanitizeUser } from "../utils/helpers.js";
import { findUserByUsername, nextUserId, persistUsers, store } from "../state/store.js";
import { signSession } from "../middleware/auth.js";

const router = Router();
const SIGN_IN_BALANCE = 1000;

router.post("/register", async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");

    if (!username || !password) {
      throw createError("Username and password are required.");
    }

    if (findUserByUsername(username)) {
      throw createError("That username is already taken.", 409);
    }

    const user = {
      id: nextUserId(),
      username,
      email: "",
      createdAt: new Date().toISOString(),
      passwordHash: await hashPassword(password),
      balance: SIGN_IN_BALANCE,
      stats: {
        winStreak: 0,
        totalWagered: 0,
        biggestWin: 0
      },
      clientSeed: "donutdrop-default",
      nonce: 0
    };

    store.users.set(user.id, user);
    await persistUsers();

    const token = signSession(user.id);

    return res.status(201).json({
      success: true,
      token,
      username: user.username,
      balance: user.balance,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const user = findUserByUsername(username);

    if (!user || !(await comparePassword(password, user.passwordHash))) {
      throw createError("Invalid username or password.", 401);
    }

    if (!user.createdAt) {
      user.createdAt = new Date().toISOString();
    }

    const token = signSession(user.id);
    await persistUsers();

    return res.json({
      success: true,
      token,
      username: user.username,
      balance: user.balance,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
