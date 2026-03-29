import mongoose from "mongoose";

const gameHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    gameType: {
      type: String,
      enum: ["mines", "dice"],
      required: true
    },
    betAmount: {
      type: Number,
      required: true,
      min: 0
    },
    payout: {
      type: Number,
      default: 0
    },
    profit: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["active", "won", "lost", "cashed_out"],
      default: "active"
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    provablyFair: {
      serverSeed: { type: String, required: true },
      serverSeedHash: { type: String, required: true },
      clientSeed: { type: String, required: true },
      nonce: { type: Number, required: true }
    }
  },
  { timestamps: true }
);

export const GameHistory = mongoose.model("GameHistory", gameHistorySchema);
