export function ensurePositiveNumber(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${fieldName} must be greater than 0.`);
  }

  return parsed;
}

export function ensureClientSeed(value) {
  if (!value || typeof value !== "string") {
    throw new Error("Client seed is required.");
  }

  return value.trim().slice(0, 64);
}
