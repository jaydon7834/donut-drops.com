import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 24
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    balance: {
      type: Number,
      default: 1000,
      min: 0
    },
    clientSeed: {
      type: String,
      default: "donutrain-default"
    },
    nonce: {
      type: Number,
      default: 0
    },
    activeMinesGameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GameHistory",
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.passwordHash;
        return ret;
      }
    }
  }
);

export const User = mongoose.model("User", userSchema);
