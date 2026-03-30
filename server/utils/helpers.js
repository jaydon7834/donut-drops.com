import bcrypt from "bcryptjs";

const MIN_BET = 1;
const MAX_BET = 1_000_000_000;

export function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    balance: user.balance,
    minecraftUsername: user.minecraftUsername || "",
    clientSeed: user.clientSeed,
    nonce: user.nonce
  };
}

export function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function ensurePositiveBet(value, currentBalance) {
  const bet = Number(value);

  if (!Number.isFinite(bet) || bet <= 0) {
    throw createError("Bet must be greater than 0.");
  }

  if (bet < MIN_BET) {
    throw createError(`Bet must be at least ${MIN_BET}.`);
  }

  if (bet > MAX_BET) {
    throw createError(`Bet cannot exceed ${MAX_BET}.`);
  }

  if (bet > currentBalance) {
    throw createError("Insufficient balance.");
  }

  return Number(bet.toFixed(2));
}

export function ensureIntegerInRange(value, min, max, message) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw createError(message);
  }

  return parsed;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
