import crypto from "crypto";
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { persistUsers, store } from "../state/store.js";
import { createError, sanitizeUser } from "../utils/helpers.js";

const router = Router();
const BOT_SECRET = process.env.MINECRAFT_BOT_SECRET || "donutdrop-bot-secret";
const CRYPTO_CONFIRM_SECRET = process.env.CRYPTO_CONFIRM_SECRET || BOT_SECRET;
const FIXED_MINECRAFT_DEPOSIT_AMOUNT = 950;
const USD_PER_MILLION = 0.07;
const MIN_CRYPTO_ORDER_USD = 5;
const supportedAssets = {
  BTC: {
    label: "Bitcoin",
    address: "bc1qlxer836vvxah73m5sl9dev78tuvfn9xkg4qqky",
    usdRate: Number(process.env.BTC_USD_RATE || 70_000),
    decimals: 8,
    txPattern: /^[a-fA-F0-9]{64}$/
  },
  ETH: {
    label: "Ethereum",
    address: "0xF8914Bb5a5fe8e3df8256877c4ed1E7F6d0BE190",
    usdRate: Number(process.env.ETH_USD_RATE || 3_500),
    decimals: 8,
    txPattern: /^0x[a-fA-F0-9]{64}$/
  },
  SOL: {
    label: "Solana",
    address: "ExWCCU5SJbYePDX59itfm69hDAiFg9EgLUCG34Z187cg",
    usdRate: Number(process.env.SOL_USD_RATE || 150),
    decimals: 6,
    txPattern: /^[1-9A-HJ-NP-Za-km-z]{64,88}$/
  }
};

function nextDepositId() {
  return `deposit_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
}

function nextCryptoOrderId() {
  return `crypto_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
}

function roundToDecimals(value, decimals) {
  return Number(value.toFixed(decimals));
}

function calculateDonutCredit(usdAmount) {
  return Math.round((usdAmount / USD_PER_MILLION) * 1_000_000);
}

function createCryptoOrderView(order) {
  const asset = supportedAssets[order.asset];

  return {
    ...order,
    address: asset.address,
    assetLabel: asset.label
  };
}

router.post("/deposit/confirm", async (req, res, next) => {
  try {
    const secret = req.headers["x-bot-secret"];

    if (secret !== BOT_SECRET) {
      throw createError("Unauthorized bot confirmation.", 401);
    }

    const minecraftUsername = String(req.body.minecraftUsername || "").trim();
    const amount = Number(req.body.amount);

    if (!minecraftUsername) {
      throw createError("Minecraft username is required.");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw createError("Amount must be greater than 0.");
    }

    if (Number(amount) !== FIXED_MINECRAFT_DEPOSIT_AMOUNT) {
      throw createError(`Minecraft deposit amount must be exactly ${FIXED_MINECRAFT_DEPOSIT_AMOUNT}.`);
    }

    const session = Array.from(store.pendingDeposits.values()).find(
      (entry) =>
        entry.status === "pending" &&
        entry.minecraftUsername.toLowerCase() === minecraftUsername.toLowerCase()
    );

    if (!session) {
      throw createError("Pending deposit session not found.", 404);
    }

    const user = store.users.get(session.userId);

    if (!user) {
      throw createError("Deposit user not found.", 404);
    }

    session.status = "completed";
    session.amount = Number(amount.toFixed(2));
    session.completedAt = new Date().toISOString();
    user.balance = Number((user.balance + session.amount).toFixed(2));

    await persistUsers();

    return res.json({
      ok: true,
      depositId: session.id,
      amount: session.amount,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return next(error);
  }
});

router.use(authMiddleware);

router.get("/crypto/assets", (req, res) => {
  const assets = Object.entries(supportedAssets).map(([symbol, config]) => ({
    symbol,
    label: config.label,
    address: config.address,
    minUsdAmount: MIN_CRYPTO_ORDER_USD,
    donutsPerOrder: calculateDonutCredit(MIN_CRYPTO_ORDER_USD),
    usdRate: config.usdRate
  }));

  return res.json({ assets });
});

router.patch("/minecraft/link", async (req, res, next) => {
  try {
    const minecraftUsername = String(req.body.minecraftUsername || "").trim();

    if (!minecraftUsername) {
      throw createError("Minecraft username is required.");
    }

    req.user.minecraftUsername = minecraftUsername.slice(0, 32);
    await persistUsers();

    return res.json({
      user: sanitizeUser(req.user)
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/deposit/session", (req, res, next) => {
  try {
    if (!req.user.minecraftUsername) {
      throw createError("Link your Minecraft account first.");
    }

    const existingSession = Array.from(store.pendingDeposits.values()).find(
      (entry) => entry.userId === req.user.id && entry.status === "pending"
    );

    if (existingSession) {
      return res.json({ session: existingSession });
    }

    const session = {
      id: nextDepositId(),
      userId: req.user.id,
      minecraftUsername: req.user.minecraftUsername,
      requiredAmount: FIXED_MINECRAFT_DEPOSIT_AMOUNT,
      status: "pending",
      createdAt: new Date().toISOString(),
      amount: 0
    };

    store.pendingDeposits.set(session.id, session);

    return res.status(201).json({ session });
  } catch (error) {
    return next(error);
  }
});

router.get("/deposit/session/:sessionId", (req, res, next) => {
  try {
    const session = store.pendingDeposits.get(String(req.params.sessionId || ""));

    if (!session || session.userId !== req.user.id) {
      throw createError("Deposit session not found.", 404);
    }

    return res.json({ session });
  } catch (error) {
    return next(error);
  }
});

router.post("/crypto/order", (req, res, next) => {
  try {
    const asset = String(req.body.asset || "").trim().toUpperCase();
    const assetConfig = supportedAssets[asset];
    const usdAmount = Number(req.body.usdAmount || MIN_CRYPTO_ORDER_USD);

    if (!assetConfig) {
      throw createError("Unsupported crypto asset.");
    }

    if (!Number.isFinite(usdAmount) || usdAmount < MIN_CRYPTO_ORDER_USD) {
      throw createError(`Crypto order must be at least $${MIN_CRYPTO_ORDER_USD}.`);
    }

    const existingOrder = Array.from(store.cryptoOrders.values()).find(
      (order) =>
        order.userId === req.user.id &&
        order.asset === asset &&
        ["pending", "submitted"].includes(order.status)
    );

    if (existingOrder) {
      if (existingOrder.status === "submitted") {
        return res.json({ order: createCryptoOrderView(existingOrder) });
      }

      existingOrder.status = "cancelled";
    }

    const expectedAmount = roundToDecimals(
      usdAmount / assetConfig.usdRate,
      assetConfig.decimals
    );

    const order = {
      id: nextCryptoOrderId(),
      userId: req.user.id,
      asset,
      status: "pending",
      usdAmount: Number(usdAmount.toFixed(2)),
      donutCredit: calculateDonutCredit(usdAmount),
      expectedAmount,
      txHash: "",
      confirmations: 0,
      createdAt: new Date().toISOString(),
      submittedAt: null,
      completedAt: null
    };

    store.cryptoOrders.set(order.id, order);

    return res.status(201).json({ order: createCryptoOrderView(order) });
  } catch (error) {
    return next(error);
  }
});

router.get("/crypto/order/:orderId", (req, res, next) => {
  try {
    const order = store.cryptoOrders.get(String(req.params.orderId || ""));

    if (!order || order.userId !== req.user.id) {
      throw createError("Crypto order not found.", 404);
    }

    return res.json({ order: createCryptoOrderView(order) });
  } catch (error) {
    return next(error);
  }
});

router.post("/crypto/order/:orderId/submit", (req, res, next) => {
  try {
    const order = store.cryptoOrders.get(String(req.params.orderId || ""));

    if (!order || order.userId !== req.user.id) {
      throw createError("Crypto order not found.", 404);
    }

    if (!["pending", "submitted"].includes(order.status)) {
      throw createError("This crypto order is no longer open.");
    }

    const txHash = String(req.body.txHash || "").trim();
    const assetConfig = supportedAssets[order.asset];

    if (!assetConfig.txPattern.test(txHash)) {
      throw createError(`Invalid ${assetConfig.label} transaction hash.`);
    }

    const duplicate = Array.from(store.cryptoOrders.values()).find(
      (entry) => entry.id !== order.id && entry.txHash.toLowerCase() === txHash.toLowerCase()
    );

    if (duplicate) {
      throw createError("That transaction hash is already attached to another order.");
    }

    order.txHash = txHash;
    order.status = "submitted";
    order.submittedAt = new Date().toISOString();

    return res.json({
      order: createCryptoOrderView(order),
      message: "Transaction submitted. Waiting for blockchain confirmation."
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/crypto/confirm", async (req, res, next) => {
  try {
    const secret = req.headers["x-bot-secret"] || req.headers["x-wallet-secret"];

    if (secret !== CRYPTO_CONFIRM_SECRET) {
      throw createError("Unauthorized crypto confirmation.", 401);
    }

    const orderId = String(req.body.orderId || "").trim();
    const txHash = String(req.body.txHash || "").trim();
    const amountReceived = Number(req.body.amountReceived);
    const confirmations = Number(req.body.confirmations || 0);
    const order = store.cryptoOrders.get(orderId);

    if (!order) {
      throw createError("Crypto order not found.", 404);
    }

    if (order.status === "confirmed") {
      return res.json({ ok: true, order: createCryptoOrderView(order) });
    }

    if (order.txHash && txHash && order.txHash.toLowerCase() !== txHash.toLowerCase()) {
      throw createError("Transaction hash does not match this order.");
    }

    if (!Number.isFinite(amountReceived) || amountReceived < order.expectedAmount) {
      throw createError("Received amount is below the required crypto amount.");
    }

    if (!Number.isFinite(confirmations) || confirmations < 1) {
      throw createError("At least one blockchain confirmation is required.");
    }

    const user = store.users.get(order.userId);

    if (!user) {
      throw createError("Crypto order user not found.", 404);
    }

    order.txHash = txHash || order.txHash;
    order.confirmations = Math.max(order.confirmations || 0, confirmations);
    order.status = "confirmed";
    order.completedAt = new Date().toISOString();
    order.amountReceived = amountReceived;
    user.balance = Number((user.balance + order.donutCredit).toFixed(2));

    await persistUsers();

    return res.json({
      ok: true,
      order: createCryptoOrderView(order),
      user: sanitizeUser(user)
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
