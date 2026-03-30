import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { nextGameId, persistUsers, pushRecentGame, store } from "../state/store.js";
import { createFairContext, generateMinesPositions } from "../utils/provablyFair.js";
import { createError, ensureIntegerInRange, ensurePositiveBet } from "../utils/helpers.js";

const router = Router();

function combination(n, k) {
  if (k > n) {
    return 0;
  }

  if (k === 0 || k === n) {
    return 1;
  }

  let result = 1;

  for (let i = 1; i <= k; i += 1) {
    result = (result * (n - (k - i))) / i;
  }

  return result;
}

function calculateMultiplier(mines, picks) {
  const totalTiles = 25;
  const houseEdge = 0.99;
  const numerator = combination(totalTiles, picks);
  const denominator = combination(totalTiles - mines, picks);
  const multiplier = (numerator / denominator) * houseEdge;

  return Number(multiplier.toFixed(4));
}

function sanitizeGame(game) {
  return {
    gameId: game.gameId,
    gameType: game.gameType,
    mines: game.mines,
    bet: game.bet,
    revealedTiles: game.revealedTiles,
    multiplier: game.multiplier,
    active: game.active,
    serverSeedHash: game.serverSeedHash,
    clientSeed: game.clientSeed,
    nonce: game.nonce,
    actionNonce: game.actionNonce,
    createdAt: game.createdAt
  };
}

router.use(authMiddleware);

router.post("/start", async (req, res, next) => {
  try {
    const mines = ensureIntegerInRange(
      req.body.mines,
      1,
      24,
      "Mines count must be between 1 and 24."
    );
    const bet = ensurePositiveBet(req.body.bet, req.user.balance);
    const clientSeed = req.body.clientSeed;

    const existingActiveGame = Array.from(store.games.values()).find(
      (game) => game.userId === req.user.id && game.gameType === "mines" && game.active
    );

    if (existingActiveGame) {
      throw createError("You already have an active mines game.");
    }

    const fair = createFairContext(req.user, clientSeed);
    const minePositions = generateMinesPositions({
      serverSeed: fair.serverSeed,
      clientSeed: fair.clientSeed,
      nonce: fair.nonce,
      mines
    });

    const game = {
      gameId: nextGameId("mines"),
      userId: req.user.id,
      gameType: "mines",
      mines,
      bet,
      revealedTiles: [],
      minePositions,
      multiplier: 1,
      active: true,
      serverSeed: fair.serverSeed,
      serverSeedHash: fair.serverSeedHash,
      clientSeed: fair.clientSeed,
      nonce: fair.nonce,
      actionNonce: 0,
      createdAt: new Date().toISOString()
    };

    req.user.balance = Number((req.user.balance - bet).toFixed(2));
    req.user.clientSeed = fair.clientSeed;
    req.user.nonce += 1;
    store.games.set(game.gameId, game);
    await persistUsers();

    return res.status(201).json({
      gameId: game.gameId,
      balance: req.user.balance,
      game: sanitizeGame(game)
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/click", (req, res, next) => {
  try {
    const gameId = String(req.body.gameId || "");
    const tileIndex = ensureIntegerInRange(
      req.body.tileIndex,
      0,
      24,
      "Tile index must be between 0 and 24."
    );
    const game = store.games.get(gameId);

    if (!game || game.userId !== req.user.id) {
      throw createError("Game not found.", 404);
    }

    if (!game.active) {
      throw createError("This game is no longer active.");
    }

    if (game.revealedTiles.includes(tileIndex)) {
      throw createError("Tile already revealed.");
    }

    game.actionNonce += 1;
    game.revealedTiles.push(tileIndex);

    if (game.minePositions.includes(tileIndex)) {
      game.active = false;

      pushRecentGame({
        _id: game.gameId,
        userId: req.user.id,
        gameType: "mines",
        betAmount: game.bet,
        profit: -game.bet,
        status: "lost"
      });

      return res.json({
        result: "mine",
        balance: req.user.balance,
        game: {
          ...sanitizeGame(game),
          minePositions: game.minePositions,
          serverSeed: game.serverSeed
        }
      });
    }

    game.multiplier = calculateMultiplier(game.minePositions.length, game.revealedTiles.length);
    const payoutPreview = Number((game.bet * game.multiplier).toFixed(2));

    return res.json({
      result: "safe",
      multiplier: game.multiplier,
      payoutPreview,
      balance: req.user.balance,
      game: sanitizeGame(game)
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/cashout", async (req, res, next) => {
  try {
    const gameId = String(req.body.gameId || "");
    const game = store.games.get(gameId);

    if (!game || game.userId !== req.user.id) {
      throw createError("Game not found.", 404);
    }

    if (!game.active) {
      throw createError("This game is no longer active.");
    }

    const payout = Number((game.bet * game.multiplier).toFixed(2));
    req.user.balance = Number((req.user.balance + payout).toFixed(2));
    game.active = false;
    game.actionNonce += 1;

    pushRecentGame({
      _id: game.gameId,
      userId: req.user.id,
      gameType: "mines",
      betAmount: game.bet,
      profit: Number((payout - game.bet).toFixed(2)),
      status: "cashed_out"
    });
    await persistUsers();

    return res.json({
      payout,
      balance: req.user.balance,
      game: {
        ...sanitizeGame(game),
        minePositions: game.minePositions,
        serverSeed: game.serverSeed
      }
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
