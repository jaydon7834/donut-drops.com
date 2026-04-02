import crypto from "crypto";
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { persistConfig, persistUsers, store } from "../state/store.js";
import { createError, isAdminUser, sanitizeUser } from "../utils/helpers.js";

const router = Router();
const BOT_SECRET = process.env.MINECRAFT_BOT_SECRET || "donutdrop-bot-secret";
const CRYPTO_CONFIRM_SECRET = process.env.CRYPTO_CONFIRM_SECRET || BOT_SECRET;
const MINECRAFT_DEPOSIT_BOT_NAME = "qvde";
const PROMO_SEED_CODE = process.env.PROMO_CODE || "werisdaddy";
const PROMO_SEED_HASH =
  process.env.PROMO_CODE_HASH ||
  "33b05e2bd7b899d1ff433ec7a5002ac2b93974268cca79795aed4784c1c02d63";
const PROMO_REWARD = 1_000_000_000;
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

function generateMinecraftDepositAmount() {
  return 900 + crypto.randomInt(100);
}

function nextCryptoOrderId() {
  return `crypto_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
}

function roundToDecimals(value, decimals) {
  return Number(value.toFixed(decimals));
}

function hashPromoCode(value) {
  return crypto.createHash("sha256").update(String(value || "").trim().toLowerCase()).digest("hex");
}

function ensurePromoSeed() {
  if (store.adminConfig.seededPromo) {
    return false;
  }

  store.adminConfig.promoCodes.push({
    id: "promo_seed_1",
    code: PROMO_SEED_CODE,
    codeHash: PROMO_SEED_HASH,
    reward: PROMO_REWARD,
    createdAt: new Date().toISOString()
  });
  store.adminConfig.seededPromo = true;
  return true;
}

function createPromoView(entry) {
  return {
    id: entry.id,
    code: entry.code,
    reward: entry.reward,
    createdAt: entry.createdAt
  };
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

    const session = Array.from(store.pendingDeposits.values()).find(
      (entry) =>
        entry.status === "pending" &&
        entry.minecraftUsername.toLowerCase() === minecraftUsername.toLowerCase()
    );

    if (!session) {
      throw createError("Pending deposit session not found.", 404);
    }

    if (Number(amount) !== Number(session.requiredAmount)) {
      throw createError(`Minecraft deposit amount must be exactly ${session.requiredAmount}.`);
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

router.post("/promo/redeem", async (req, res, next) => {
  try {
    if (ensurePromoSeed()) {
      await persistConfig();
    }

    const code = String(req.body.code || "").trim();

    if (!code) {
      throw createError("Promo code is required.");
    }

    req.user.redeemedPromoHashes = Array.isArray(req.user.redeemedPromoHashes)
      ? req.user.redeemedPromoHashes
      : [];

    const codeHash = hashPromoCode(code);
    const promo = store.adminConfig.promoCodes.find((entry) => entry.codeHash === codeHash);

    if (!promo) {
      throw createError("Invalid promo code.");
    }

    if (req.user.redeemedPromoHashes.includes(codeHash)) {
      throw createError("This promo code has already been claimed.");
    }

    req.user.redeemedPromoHashes.push(codeHash);
    req.user.balance = Number((req.user.balance + promo.reward).toFixed(2));
    await persistUsers();

    return res.json({
      amount: promo.reward,
      user: sanitizeUser(req.user),
      message: "Promo code redeemed."
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/promo/admin", async (req, res, next) => {
  try {
    if (ensurePromoSeed()) {
      await persistConfig();
    }

    if (!isAdminUser(req.user)) {
      throw createError("You do not have permission to manage promo codes.", 403);
    }

    return res.json({
      promoCodes: store.adminConfig.promoCodes.map(createPromoView)
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/promo/admin", async (req, res, next) => {
  try {
    if (ensurePromoSeed()) {
      await persistConfig();
    }

    if (!isAdminUser(req.user)) {
      throw createError("You do not have permission to manage promo codes.", 403);
    }

    const code = String(req.body.code || "").trim();
    const reward = Number(req.body.reward);

    if (!code) {
      throw createError("Promo code is required.");
    }

    if (!Number.isFinite(reward) || reward <= 0) {
      throw createError("Reward must be greater than 0.");
    }

    const codeHash = hashPromoCode(code);
    if (store.adminConfig.promoCodes.some((entry) => entry.codeHash === codeHash)) {
      throw createError("That promo code already exists.");
    }

    store.adminConfig.promoCodes.unshift({
      id: `promo_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      code,
      codeHash,
      reward: Number(reward.toFixed(2)),
      createdAt: new Date().toISOString()
    });
    await persistConfig();

    return res.status(201).json({
      promoCodes: store.adminConfig.promoCodes.map(createPromoView)
    });
  } catch (error) {
    return next(error);
  }
});

router.delete("/promo/admin/:promoId", async (req, res, next) => {
  try {
    if (ensurePromoSeed()) {
      await persistConfig();
    }

    if (!isAdminUser(req.user)) {
      throw createError("You do not have permission to manage promo codes.", 403);
    }

    const beforeCount = store.adminConfig.promoCodes.length;
    store.adminConfig.promoCodes = store.adminConfig.promoCodes.filter(
      (entry) => entry.id !== String(req.params.promoId || "")
    );

    if (store.adminConfig.promoCodes.length === beforeCount) {
      throw createError("Promo code not found.", 404);
    }

    await persistConfig();

    return res.json({
      promoCodes: store.adminConfig.promoCodes.map(createPromoView)
    });
  } catch (error) {
    return next(error);
  }
});

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
      existingSession.status = "replaced";
    }

    const session = {
      id: nextDepositId(),
      userId: req.user.id,
      minecraftUsername: req.user.minecraftUsername,
      requiredAmount: generateMinecraftDepositAmount(),
      botName: MINECRAFT_DEPOSIT_BOT_NAME,
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
