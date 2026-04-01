const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options = {}, token) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

export const api = {
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  getBalance: (token) => request("/user/balance", {}, token),
  getPlayers: (token) => request("/user/players", {}, token),
  linkMinecraft: (token, payload) =>
    request(
      "/wallet/minecraft/link",
      {
        method: "PATCH",
        body: JSON.stringify(payload)
      },
      token
    ),
  createDepositSession: (token) =>
    request(
      "/wallet/deposit/session",
      {
        method: "POST"
      },
      token
    ),
  getDepositSession: (token, sessionId) => request(`/wallet/deposit/session/${sessionId}`, {}, token),
  getCryptoAssets: (token) => request("/wallet/crypto/assets", {}, token),
  redeemPromoCode: (token, payload) =>
    request(
      "/wallet/promo/redeem",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  createCryptoOrder: (token, payload) =>
    request(
      "/wallet/crypto/order",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  getCryptoOrder: (token, orderId) => request(`/wallet/crypto/order/${orderId}`, {}, token),
  submitCryptoOrder: (token, orderId, payload) =>
    request(
      `/wallet/crypto/order/${orderId}/submit`,
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  tipUser: (token, payload) =>
    request(
      "/user/tip",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  updateBalance: (token, balance) =>
    request(
      "/user/update-balance",
      {
        method: "POST",
        body: JSON.stringify({ balance })
      },
      token
    ),
  updateClientSeed: (token, clientSeed) =>
    request(
      "/user/seed",
      {
        method: "PATCH",
        body: JSON.stringify({ clientSeed })
      },
      token
    ),
  startMines: (token, payload) =>
    request(
      "/game/mines/start",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  clickMines: (token, payload) =>
    request(
      "/game/mines/click",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  cashoutMines: (token, payload) =>
    request(
      "/game/mines/cashout",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  rollDice: (token, payload) =>
    request(
      "/game/dice/roll",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  startBlackjack: (token, payload) =>
    request(
      "/game/blackjack/start",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  hitBlackjack: (token, payload) =>
    request(
      "/game/blackjack/hit",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  standBlackjack: (token, payload) =>
    request(
      "/game/blackjack/stand",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  startChicken: (token, payload) =>
    request(
      "/game/chicken/start",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  stepChicken: (token, payload) =>
    request(
      "/game/chicken/step",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  cashoutChicken: (token, payload) =>
    request(
      "/game/chicken/cashout",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  getCrashState: (token) => request("/game/crash/state", {}, token),
  placeCrashBet: (token, payload) =>
    request(
      "/game/crash/bet",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  cashoutCrash: (token, payload) =>
    request(
      "/game/crash/cashout",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  spinRoulette: (token, payload) =>
    request(
      "/game/roulette/spin",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  rollLimbo: (token, payload) =>
    request(
      "/game/limbo/roll",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  dropPlinko: (token, payload) =>
    request(
      "/game/plinko/drop",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  playInstant: (token, payload) =>
    request(
      "/game/instant/play",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  getCaseBattles: (token) => request("/game/instant/case-battles", {}, token),
  createCaseBattle: (token, payload) =>
    request(
      "/game/instant/case-battles",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  cancelCaseBattle: (token, battleId) =>
    request(
      `/game/instant/case-battles/${battleId}`,
      {
        method: "DELETE"
      },
      token
    ),
  joinCaseBattle: (token, battleId, payload) =>
    request(
      `/game/instant/case-battles/${battleId}/join`,
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  getChat: (token) => request("/chat", {}, token),
  sendChat: (token, payload) =>
    request(
      "/chat",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    ),
  getRain: (token) => request("/rain", {}, token),
  startRain: (token) =>
    request(
      "/rain/start",
      {
        method: "POST"
      },
      token
    ),
  joinRain: (token) =>
    request(
      "/rain/join",
      {
        method: "POST"
      },
      token
    )
};
