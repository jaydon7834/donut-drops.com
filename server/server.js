import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import minesRoutes from "./routes/mines.js";
import diceRoutes from "./routes/dice.js";
import { initializeStore } from "./state/store.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true
  })
);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/game/mines", minesRoutes);
app.use("/game/dice", diceRoutes);

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
    app.listen(4000, () => {
      console.log("DonutDrop API running on http://localhost:4000");
    });
  })
  .catch((error) => {
    console.error("Failed to initialize DonutDrop storage", error);
    process.exit(1);
  });
