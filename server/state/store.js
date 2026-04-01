import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

export const store = {
  users: new Map(),
  sessions: new Map(),
  games: new Map(),
  pendingDeposits: new Map(),
  cryptoOrders: new Map(),
  houseStats: {
    totalBets: 0,
    totalPayouts: 0,
    profit: 0,
    byGame: {}
  },
  recentGames: [],
  chatMessages: [
    {
      id: "chat_seed_1",
      username: "system",
      text: "Welcome to DonutDrop chat.",
      createdAt: new Date().toISOString()
    }
  ],
  chatTimeouts: new Map(),
  rain: {
    active: false,
    amount: 0,
    participants: [],
    endTime: 0,
    timer: null,
    nextTimer: null,
    nextStartAt: 0
  },
  caseBattles: new Map(),
  crash: {
    roundNumber: 0,
    currentRound: null,
    pendingEntries: [],
    history: [],
    tickInterval: null,
    nextRoundTimer: null
  }
};

let userSequence = 1;
let gameSequence = 1;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const USERS_FILE = process.env.USERS_FILE
  ? path.resolve(process.env.USERS_FILE)
  : path.join(__dirname, "..", "users.json");

async function ensureUsersDirectory() {
  await fs.mkdir(path.dirname(USERS_FILE), { recursive: true });
}

export async function initializeStore() {
  try {
    await ensureUsersDirectory();
    const raw = await fs.readFile(USERS_FILE, "utf8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return;
    }

    parsed.forEach((user) => {
      store.users.set(user.id, {
        ...user,
        createdAt: user.createdAt || new Date().toISOString(),
        redeemedPromoHashes: Array.isArray(user.redeemedPromoHashes)
          ? user.redeemedPromoHashes
          : [],
        stats: {
          winStreak: user.stats?.winStreak || 0,
          totalWagered: user.stats?.totalWagered || 0,
          biggestWin: user.stats?.biggestWin || 0
        }
      });
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
  await ensureUsersDirectory();
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
  const user = store.users.get(entry.userId);

  if (user) {
    user.stats = user.stats || { winStreak: 0, totalWagered: 0, biggestWin: 0 };
    user.stats.totalWagered = Number(
      ((user.stats.totalWagered || 0) + Number(entry.betAmount || 0)).toFixed(2)
    );

    if (Number(entry.profit || 0) > 0) {
      user.stats.winStreak = (user.stats.winStreak || 0) + 1;
      user.stats.biggestWin = Math.max(user.stats.biggestWin || 0, Number(entry.profit || 0));
    } else {
      user.stats.winStreak = 0;
    }
  }

  store.recentGames.unshift(entry);
  store.recentGames = store.recentGames.slice(0, 50);
}

export function recordHouseStats(gameType, betAmount, payout = 0) {
  const safeBet = Number(betAmount || 0);
  const safePayout = Number(payout || 0);
  const currentByGame = store.houseStats.byGame[gameType] || {
    totalBets: 0,
    totalPayouts: 0,
    profit: 0
  };

  currentByGame.totalBets = Number((currentByGame.totalBets + safeBet).toFixed(2));
  currentByGame.totalPayouts = Number((currentByGame.totalPayouts + safePayout).toFixed(2));
  currentByGame.profit = Number(
    (currentByGame.totalBets - currentByGame.totalPayouts).toFixed(2)
  );

  store.houseStats.totalBets = Number((store.houseStats.totalBets + safeBet).toFixed(2));
  store.houseStats.totalPayouts = Number(
    (store.houseStats.totalPayouts + safePayout).toFixed(2)
  );
  store.houseStats.profit = Number(
    (store.houseStats.totalBets - store.houseStats.totalPayouts).toFixed(2)
  );
  store.houseStats.byGame[gameType] = currentByGame;
}

export function getChatMessages() {
  return store.chatMessages.slice(-60);
}
