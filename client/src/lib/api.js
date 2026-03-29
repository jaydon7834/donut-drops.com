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
    )
};
