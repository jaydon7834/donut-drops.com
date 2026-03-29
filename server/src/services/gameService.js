import mongoose from "mongoose";
import { GameHistory } from "../models/GameHistory.js";
import { User } from "../models/User.js";
import { createFairContext, generateDiceRoll, generateMinesLayout } from "../utils/fairness.js";
import { ensureClientSeed, ensurePositiveNumber } from "../utils/validation.js";

const MINES_GRID_SIZE = 5;
const HOUSE_EDGE = 0.99;

function calculateMinesMultiplier(safePicks, mineCount) {
  if (safePicks <= 0) {
    return 1;
  }

  let multiplier = 1;
  const tiles = MINES_GRID_SIZE * MINES_GRID_SIZE;

  for (let pick = 0; pick < safePicks; pick += 1) {
    multiplier *= (tiles - pick) / (tiles - mineCount - pick);
  }

  return Number((multiplier * HOUSE_EDGE).toFixed(4));
}

function calculateDiceMultiplier(target, condition) {
  const chance = condition === "under" ? target : 100 - target;
  return Number((HOUSE_EDGE * (100 / chance)).toFixed(4));
}

export async function getBalanceSummary(userId) {
  const user = await User.findById(userId).select("username email balance clientSeed nonce");
  const recentGames = await GameHistory.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .select("gameType betAmount payout profit status result provablyFair createdAt");

  return { user, recentGames };
}

export async function updateClientSeed(userId, clientSeed) {
  const normalizedSeed = ensureClientSeed(clientSeed);
  const user = await User.findByIdAndUpdate(
    userId,
    { clientSeed: normalizedSeed },
    { new: true }
  ).select("username email balance clientSeed nonce");

  return user;
}

export async function startMinesGame(userId, { betAmount, minesCount, clientSeed }) {
  const session = await mongoose.startSession();

  try {
    let payload;
    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      const wager = ensurePositiveNumber(betAmount, "Bet amount");
      const selectedMines = Number(minesCount);

      if (selectedMines < 1 || selectedMines > 24) {
        throw new Error("Mines count must be between 1 and 24.");
      }

      if (user.balance < wager) {
        throw new Error("Insufficient balance.");
      }

      if (user.activeMinesGameId) {
        throw new Error("Finish your active mines round before starting a new one.");
      }

      if (clientSeed) {
        user.clientSeed = ensureClientSeed(clientSeed);
      }

      const fair = createFairContext(user.clientSeed, user.nonce);
      const minePositions = generateMinesLayout({
        size: MINES_GRID_SIZE,
        mineCount: selectedMines,
        serverSeed: fair.serverSeed,
        clientSeed: fair.clientSeed,
        nonce: fair.nonce
      });

      user.balance -= wager;
      user.nonce += 1;

      const game = await GameHistory.create(
        [
          {
            user: user._id,
            gameType: "mines",
            betAmount: wager,
            status: "active",
            result: {
              gridSize: MINES_GRID_SIZE,
              minesCount: selectedMines,
              minePositions,
              revealedTiles: [],
              safePicks: 0,
              currentMultiplier: 1
            },
            provablyFair: fair
          }
        ],
        { session }
      );

      user.activeMinesGameId = game[0]._id;
      await user.save({ session });

      payload = {
        balance: user.balance,
        game: sanitizeMinesGame(game[0])
      };
    });

    return payload;
  } finally {
    session.endSession();
  }
}

function sanitizeMinesGame(game) {
  return {
    id: game._id,
    status: game.status,
    betAmount: game.betAmount,
    gridSize: game.result.gridSize,
    minesCount: game.result.minesCount,
    revealedTiles: game.result.revealedTiles,
    safePicks: game.result.safePicks,
    currentMultiplier: game.result.currentMultiplier,
    payoutPreview: Number((game.betAmount * game.result.currentMultiplier).toFixed(2)),
    serverSeedHash: game.provablyFair.serverSeedHash,
    clientSeed: game.provablyFair.clientSeed,
    nonce: game.provablyFair.nonce
  };
}

export async function clickMinesTile(userId, { tileIndex, cashOut = false }) {
  const session = await mongoose.startSession();

  try {
    let payload;
    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      const game = await GameHistory.findOne({
        _id: user.activeMinesGameId,
        user: user._id,
        gameType: "mines",
        status: "active"
      }).session(session);

      if (!game) {
        throw new Error("No active mines game.");
      }

      if (cashOut) {
        const payout = Number((game.betAmount * game.result.currentMultiplier).toFixed(2));
        user.balance += payout;
        user.activeMinesGameId = null;
        game.status = "cashed_out";
        game.payout = payout;
        game.profit = Number((payout - game.betAmount).toFixed(2));
        await game.save({ session });
        await user.save({ session });

        payload = {
          balance: user.balance,
          game: {
            ...sanitizeMinesGame(game),
            minePositions: game.result.minePositions,
            serverSeed: game.provablyFair.serverSeed
          }
        };
        return;
      }

      const index = Number(tileIndex);
      const maxIndex = game.result.gridSize * game.result.gridSize - 1;

      if (!Number.isInteger(index) || index < 0 || index > maxIndex) {
        throw new Error("Tile index is out of range.");
      }

      if (game.result.revealedTiles.includes(index)) {
        throw new Error("Tile already revealed.");
      }

      game.result.revealedTiles.push(index);

      if (game.result.minePositions.includes(index)) {
        game.status = "lost";
        game.payout = 0;
        game.profit = Number((-game.betAmount).toFixed(2));
        user.activeMinesGameId = null;
        await game.save({ session });
        await user.save({ session });

        payload = {
          balance: user.balance,
          game: {
            ...sanitizeMinesGame(game),
            minePositions: game.result.minePositions,
            hitMine: true,
            serverSeed: game.provablyFair.serverSeed
          }
        };
        return;
      }

      game.result.safePicks += 1;
      game.result.currentMultiplier = calculateMinesMultiplier(
        game.result.safePicks,
        game.result.minesCount
      );
      await game.save({ session });

      payload = {
        balance: user.balance,
        game: sanitizeMinesGame(game)
      };
    });

    return payload;
  } finally {
    session.endSession();
  }
}

export async function rollDice(userId, { betAmount, target, condition, clientSeed }) {
  const session = await mongoose.startSession();

  try {
    let payload;
    await session.withTransaction(async () => {
      const user = await User.findById(userId).session(session);
      const wager = ensurePositiveNumber(betAmount, "Bet amount");
      const diceTarget = Number(target);

      if (!["under", "over"].includes(condition)) {
        throw new Error("Condition must be under or over.");
      }

      if (diceTarget <= 1 || diceTarget >= 98) {
        throw new Error("Target must be between 1 and 98.");
      }

      if (user.balance < wager) {
        throw new Error("Insufficient balance.");
      }

      if (clientSeed) {
        user.clientSeed = ensureClientSeed(clientSeed);
      }

      const fair = createFairContext(user.clientSeed, user.nonce);
      const roll = generateDiceRoll(fair);
      const isWin = condition === "under" ? roll < diceTarget : roll > diceTarget;
      const multiplier = calculateDiceMultiplier(diceTarget, condition);
      const payout = isWin ? Number((wager * multiplier).toFixed(2)) : 0;

      user.balance = Number((user.balance - wager + payout).toFixed(2));
      user.nonce += 1;

      const game = await GameHistory.create(
        [
          {
            user: user._id,
            gameType: "dice",
            betAmount: wager,
            payout,
            profit: Number((payout - wager).toFixed(2)),
            status: isWin ? "won" : "lost",
            result: {
              roll,
              target: diceTarget,
              condition,
              multiplier,
              isWin
            },
            provablyFair: fair
          }
        ],
        { session }
      );

      await user.save({ session });

      payload = {
        balance: user.balance,
        game: {
          id: game[0]._id,
          status: game[0].status,
          betAmount: wager,
          payout,
          profit: game[0].profit,
          result: game[0].result,
          provablyFair: {
            ...fair,
            roll
          }
        }
      };
    });

    return payload;
  } finally {
    session.endSession();
  }
}
