import { Router } from "express";
import { comparePassword, createError, hashPassword, sanitizeUser } from "../utils/helpers.js";
import { findUserByEmail, findUserByUsername, nextUserId, persistUsers, store } from "../state/store.js";
import { signSession } from "../middleware/auth.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!username || !email || !password) {
      throw createError("Username, email, and password are required.");
    }

    if (findUserByEmail(email)) {
      throw createError("An account with that email already exists.", 409);
    }

    const user = {
      id: nextUserId(),
      username,
      email,
      passwordHash: await hashPassword(password),
      balance: 1_000_000_000_000,
      clientSeed: "donutdrop-default",
      nonce: 0
    };

    store.users.set(user.id, user);
    await persistUsers();

    const token = signSession(user.id);

    return res.status(201).json({
      token,
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

    const token = signSession(user.id);

    return res.json({
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
