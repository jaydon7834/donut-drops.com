import jwt from "jsonwebtoken";
import { store } from "../state/store.js";

const JWT_SECRET = process.env.JWT_SECRET || "donutdrop-dev-secret";

export function signSession(userId) {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
  store.sessions.set(token, userId);
  return token;
}

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const sessionUserId = store.sessions.get(token);
    const user = store.users.get(payload.userId);

    if (!sessionUserId || !user || sessionUserId !== user.id) {
      return res.status(401).json({ message: "Invalid session." });
    }

    req.token = token;
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
