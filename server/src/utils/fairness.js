import crypto from "crypto";
import { sha256 } from "./hash.js";

export function generateServerSeed() {
  return crypto.randomBytes(32).toString("hex");
}

export function getServerSeedHash(serverSeed) {
  return sha256(serverSeed);
}

export function createFairContext(clientSeed, nonce) {
  const serverSeed = generateServerSeed();

  return {
    serverSeed,
    serverSeedHash: getServerSeedHash(serverSeed),
    clientSeed,
    nonce
  };
}

function hmac(serverSeed, clientSeed, nonce, round) {
  return crypto
    .createHmac("sha256", serverSeed)
    .update(`${clientSeed}:${nonce}:${round}`)
    .digest("hex");
}

export function randomFloatsFromSeeds(serverSeed, clientSeed, nonce, count) {
  const values = [];
  let round = 0;

  while (values.length < count) {
    const digest = hmac(serverSeed, clientSeed, nonce, round);

    for (let index = 0; index < digest.length && values.length < count; index += 8) {
      const chunk = digest.slice(index, index + 8);
      const value = parseInt(chunk, 16) / 0xffffffff;
      values.push(value);
    }

    round += 1;
  }

  return values;
}

export function randomIntFromSeed(serverSeed, clientSeed, nonce, min, max, cursor = 0) {
  const [value] = randomFloatsFromSeeds(serverSeed, clientSeed, nonce, cursor + 1).slice(cursor);
  return Math.floor(value * (max - min + 1)) + min;
}

export function generateMinesLayout({ size, mineCount, serverSeed, clientSeed, nonce }) {
  const positions = Array.from({ length: size * size }, (_, index) => index);
  const floats = randomFloatsFromSeeds(serverSeed, clientSeed, nonce, mineCount * 2);
  const mines = [];
  let cursor = 0;

  while (mines.length < mineCount && positions.length) {
    const pickIndex = Math.floor(floats[cursor % floats.length] * positions.length);
    mines.push(positions.splice(pickIndex, 1)[0]);
    cursor += 1;
  }

  return mines.sort((a, b) => a - b);
}

export function generateDiceRoll({ serverSeed, clientSeed, nonce }) {
  const roll = randomIntFromSeed(serverSeed, clientSeed, nonce, 0, 9999) / 100;
  return Number(roll.toFixed(2));
}
