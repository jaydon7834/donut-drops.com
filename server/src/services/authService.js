import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signToken } from "../utils/tokens.js";

export async function registerUser({ username, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim();

  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { username: normalizedUsername }]
  });

  if (existingUser) {
    throw new Error("An account with that email or username already exists.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash
  });

  return {
    token: signToken(user._id.toString()),
    user
  };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    throw new Error("Invalid email or password.");
  }

  return {
    token: signToken(user._id.toString()),
    user
  };
}
