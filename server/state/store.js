import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

export const store = {
  users: new Map(),
  sessions: new Map(),
  games: new Map(),
  recentGames: []
};

let userSequence = 1;
let gameSequence = 1;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_FILE = path.join(__dirname, "..", "users.json");

export async function initializeStore() {
  try {
    const raw = await fs.readFile(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return;
    }

    parsed.forEach((user) => {
      store.users.set(user.id, user);
    });

    const highestUserId = parsed.reduce((max, user) => {
      const match = String(user.id || "").match(/^user_(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);

    userSequence = highestUserId + 1;
  } catch (error) {
    if (error.code === "ENOENT") {
      await persistUsers();
      return;
    }

    throw error;
  }
}

export async function persistUsers() {
  await fs.writeFile(
    USERS_FILE,
    JSON.stringify(Array.from(store.users.values()), null, 2),
    "utf8"
  );
}

export function nextUserId() {
  const id = `user_${userSequence}`;
  userSequence += 1;
  return id;
}

export function nextGameId(prefix = "game") {
  const id = `${prefix}_${gameSequence}`;
  gameSequence += 1;
  return id;
}

export function findUserByEmail(email) {
  return Array.from(store.users.values()).find((user) => user.email === email) || null;
}

export function findUserByUsername(username) {
  return Array.from(store.users.values()).find((user) => user.username === username) || null;
}

export function getRecentGamesForUser(userId) {
  return store.recentGames.filter((game) => game.userId === userId).slice(0, 10);
}

export function pushRecentGame(entry) {
  store.recentGames.unshift(entry);
  store.recentGames = store.recentGames.slice(0, 50);
}
