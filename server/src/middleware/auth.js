import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid session." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}
