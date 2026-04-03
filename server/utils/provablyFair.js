import crypto from "crypto";

export function createServerSeed() {
  return crypto.randomBytes(32).toString("hex");
}

export function createServerSeedHash(serverSeed) {
  return crypto.createHash("sha256").update(serverSeed).digest("hex");
}

export function createFairContext(user, clientSeedInput) {
  const clientSeed = String(clientSeedInput || user.clientSeed || "donutrain-default")
    .trim()
    .slice(0, 64);
  const serverSeed = createServerSeed();

  return {
    serverSeed,
    serverSeedHash: createServerSeedHash(serverSeed),
    clientSeed,
    nonce: user.nonce
  };
}

export function hashToFloat(serverSeed, clientSeed, nonce) {
  const hash = crypto
    .createHash("sha256")
    .update(`${serverSeed}:${clientSeed}:${nonce}`)
    .digest("hex");

  const segment = hash.slice(0, 13);
  const integer = parseInt(segment, 16);
  // 13 hex chars = 52 bits. Divide by 2^52 so the value spans [0, 1)
  // instead of being artificially compressed toward 0.
  const max = 0x10000000000000;

  return {
    hash,
    value: integer / max
  };
}

export function generateMinesPositions({ serverSeed, clientSeed, nonce, mines }) {
  const positions = [];
  const used = new Set();
  let cursor = 0;

  while (positions.length < mines) {
    const { hash } = hashToFloat(serverSeed, clientSeed, nonce + cursor);

    for (let index = 0; index < hash.length && positions.length < mines; index += 2) {
      const candidate = parseInt(hash.slice(index, index + 2), 16) % 25;

      if (!used.has(candidate)) {
        used.add(candidate);
        positions.push(candidate);
      }
    }

    cursor += 1;
  }

  return positions.sort((a, b) => a - b);
}

export function generateDiceResult({ serverSeed, clientSeed, nonce }) {
  const { hash } = hashToFloat(serverSeed, clientSeed, nonce);
  const integer = parseInt(hash.slice(0, 8), 16);
  const max = 0xffffffff;

  return {
    hash,
    roll: Number((((integer / max) * 100)).toFixed(2)),
    value: integer / max
  };
}
