import cors from "cors";
import express from "express";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { env } from "./config/env.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true
    })
  );
  app.use(express.json());
  app.use(morgan("dev"));

  app.get("/health", (req, res) => {
    res.json({ ok: true });
  });

  app.use("/auth", authRoutes);
  app.use("/user", userRoutes);
  app.use("/game", gameRoutes);
  app.use(errorHandler);

  return app;
}
