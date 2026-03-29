import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { getRecentGamesForUser, persistUsers } from "../state/store.js";
import { sanitizeUser } from "../utils/helpers.js";

const router = Router();

router.use(authMiddleware);

router.get("/balance", (req, res) => {
  res.json({
    user: sanitizeUser(req.user),
    recentGames: getRecentGamesForUser(req.user.id)
  });
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

export default router;
