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
  tipUser: (token, payload) =>
    request(
      "/user/tip",
      {
        method: "POST",
        body: JSON.stringify(payload)
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
  getChat: (token) => request("/chat", {}, token),
  sendChat: (token, payload) =>
    request(
      "/chat",
      {
        method: "POST",
        body: JSON.stringify(payload)
      },
      token
    )
};
