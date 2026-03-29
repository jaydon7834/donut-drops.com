import bcrypt from "bcryptjs";

export function sanitizeUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    balance: user.balance,
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

  if (bet > currentBalance) {
    throw createError("Insufficient balance.");
  }

  return Number(bet.toFixed(2));
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
