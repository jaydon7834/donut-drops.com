import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import walletRoutes from "./routes/wallet.js";
import minesRoutes from "./routes/mines.js";
import diceRoutes from "./routes/dice.js";
import blackjackRoutes from "./routes/blackjack.js";
import chickenRoutes from "./routes/chicken.js";
import rouletteRoutes from "./routes/roulette.js";
import limboRoutes from "./routes/limbo.js";
import plinkoRoutes from "./routes/plinko.js";
import instantRoutes from "./routes/instant.js";
import chatRoutes from "./routes/chat.js";
import { initializeStore, USERS_FILE } from "./state/store.js";
import { createRateLimiter } from "./middleware/rateLimit.js";

const app = express();
const PORT = process.env.PORT || 4000;
const authLimiter = createRateLimiter({ windowMs: 60 * 1000, maxHits: 30, keyPrefix: "auth" });
const gameLimiter = createRateLimiter({ windowMs: 10 * 1000, maxHits: 50, keyPrefix: "game" });

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authLimiter, authRoutes);
app.use("/user", userRoutes);
app.use("/wallet", walletRoutes);
app.use("/game/mines", gameLimiter, minesRoutes);
app.use("/game/dice", gameLimiter, diceRoutes);
app.use("/game/blackjack", gameLimiter, blackjackRoutes);
app.use("/game/chicken", gameLimiter, chickenRoutes);
app.use("/game/roulette", gameLimiter, rouletteRoutes);
app.use("/game/limbo", gameLimiter, limboRoutes);
app.use("/game/plinko", gameLimiter, plinkoRoutes);
app.use("/game/instant", gameLimiter, instantRoutes);
app.use("/chat", chatRoutes);

app.use((error, req, res, next) => {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(error.status || 500).json({
    message: error.message || "Internal server error."
  });
});

initializeStore()
  .then(() => {
    console.log(`DonutDrop users file: ${USERS_FILE}`);
    app.listen(PORT, () => {
      console.log(`DonutDrop API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize DonutDrop storage", error);
    process.exit(1);
  });
