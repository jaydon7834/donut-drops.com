import crypto from "crypto";

export function createServerSeed() {
  return crypto.randomBytes(32).toString("hex");
}

export function createServerSeedHash(serverSeed) {
  return crypto.createHash("sha256").update(serverSeed).digest("hex");
}

export function createFairContext(user, clientSeedInput) {
  const clientSeed = String(clientSeedInput || user.clientSeed || "donutdrop-default")
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
  const max = 0x1fffffffffffff;

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
  const { hash, value } = hashToFloat(serverSeed, clientSeed, nonce);
  return {
    hash,
    roll: Number((value * 100).toFixed(2)),
    value
  };
}
