import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { MinesGame } from "./MinesGame.jsx";
import { DiceGame } from "./DiceGame.jsx";
import { BlackjackGame } from "./BlackjackGame.jsx";
import { ChickenGame } from "./ChickenGame.jsx";
import { RouletteGame } from "./RouletteGame.jsx";
import { LimboGame } from "./LimboGame.jsx";
import { PlinkoGame } from "./PlinkoGame.jsx";
import { CrashGame } from "./CrashGame.jsx";
import { ArcadeGame } from "./ArcadeGame.jsx";
import { FairnessCard } from "./FairnessCard.jsx";
import { GameCard } from "./GameCard.jsx";
import { ThemeEffects } from "./ThemeEffects.jsx";
import { WalletDisplay } from "./WalletDisplay.jsx";
import { api } from "../lib/api.js";
import { parseBetInput } from "../lib/betting.js";
import { createAppSocket } from "../lib/socket.js";

const topNavItems = ["Fairness", "Affiliate", "Bonus", "Leaderboard", "Profile", "Store"];
const THEME_STORAGE_KEY = "donutdrop-theme";
const GLOW_STORAGE_KEY = "donutdrop-glow";
const DARK_STORAGE_KEY = "donutdrop-dark";
const SOUND_STORAGE_KEY = "donutdrop-sound";
const EFFECTS_STORAGE_KEY = "donutdrop-effects";
const LEVEL_REWARD_STORAGE_KEY = "donutdrop-level-reward";
const THEMES = {
  green: {
    label: "Green",
    bg: "radial-gradient(circle at top, #022c22, #020617)",
    accent: "#00ff88",
    accentGradient: "linear-gradient(135deg, #00ff88, #34d399)"
  },
  purple: {
    label: "Purple",
    bg: "radial-gradient(circle at top, #1e1b4b, #020617)",
    accent: "#a855f7",
    accentGradient: "linear-gradient(135deg, #a855f7, #7c3aed)"
  },
  blue: {
    label: "Blue",
    bg: "radial-gradient(circle at top, #0c4a6e, #020617)",
    accent: "#38bdf8",
    accentGradient: "linear-gradient(135deg, #38bdf8, #0ea5e9)"
  },
  rainbow: {
    label: "Rainbow",
    bg: "linear-gradient(135deg, #020617, #020617)",
    accent: "#38bdf8",
    accentGradient: "linear-gradient(90deg, #00ff88, #38bdf8, #a855f7, #facc15)"
  },
  red: {
    label: "Red",
    bg: "radial-gradient(circle at top, #450a0a, #020617)",
    accent: "#ff3b3b",
    accentGradient: "linear-gradient(135deg, #ff3b3b, #ef4444)"
  }
};

const gameCards = [
  { id: "blackjack", label: "Blackjack", accent: "from-orange-700 via-orange-500 to-amber-300", players: 6, image: "/images/blackjack-dashboard.png" },
  { id: "mines", label: "Mines", accent: "from-emerald-900 via-emerald-500 to-lime-300", players: 8, image: "/images/mines-dashboard.png" },
  { id: "dice", label: "Dice", accent: "from-indigo-900 via-violet-500 to-sky-300", players: 5, image: "/images/dice-dashboard.png" },
  { id: "roulette", label: "Roulette", accent: "from-fuchsia-900 via-pink-500 to-amber-300", players: 7, image: "/images/roulette-dashboard.png" },
  { id: "chicken", label: "Chicken", accent: "from-rose-900 via-orange-500 to-amber-300", players: 4, image: "/images/chicken-dashboard.png" },
  { id: "limbo", label: "Limbo", accent: "from-amber-800 via-orange-500 to-yellow-300", players: 6, image: "/images/limbo-dashboard.png" },
  { id: "plinko", label: "Plinko", accent: "from-cyan-900 via-cyan-500 to-sky-300", players: 3, image: "/images/plinko-dashboard.png" },
  { id: "crash", label: "Crash", accent: "from-yellow-500 via-orange-400 to-sky-400", players: 12, image: "/images/crash-dashboard.png" },
  { id: "cases", label: "Cases", accent: "from-fuchsia-700 via-pink-500 to-amber-300", players: 5, image: "/images/cases-dashboard.png" },
  { id: "case-battles", label: "Case Battles", accent: "from-sky-800 via-blue-500 to-indigo-300", players: 4, image: "/images/case-battles-dashboard.png" }
];

const sideGames = ["Crash", "Cases", "Case Battles", "Blackjack", "Mines", "Plinko", "Limbo", "Dice", "Roulette", "Chicken"];
const FALLBACK_CRYPTO_ASSETS = [
  { symbol: "BTC", label: "Bitcoin", address: "bc1qlxer836vvxah73m5sl9dev78tuvfn9xkg4qqky", minUsdAmount: 5, donutsPerOrder: 71_428_571 },
  { symbol: "ETH", label: "Ethereum", address: "0xF8914Bb5a5fe8e3df8256877c4ed1E7F6d0BE190", minUsdAmount: 5, donutsPerOrder: 71_428_571 },
  { symbol: "SOL", label: "Solana", address: "ExWCCU5SJbYePDX59itfm69hDAiFg9EgLUCG34Z187cg", minUsdAmount: 5, donutsPerOrder: 71_428_571 }
];

function formatMoney(value) {
  const amount = Number(value || 0);

  if (amount >= 1_000_000_000) {
    return `$${trimCompact(amount / 1_000_000_000)}b`;
  }

  if (amount >= 1_000_000) {
    return `$${trimCompact(amount / 1_000_000)}m`;
  }

  if (amount >= 1_000) {
    return `$${trimCompact(amount / 1_000)}k`;
  }

  return `$${amount.toFixed(amount >= 100 ? 0 : 2).replace(/\.00$/, "")}`;
}

function formatCompactNumber(value) {
  const amount = Number(value || 0);

  if (amount >= 1_000_000_000) {
    return `${trimCompact(amount / 1_000_000_000)}b`;
  }

  if (amount >= 1_000_000) {
    return `${trimCompact(amount / 1_000_000)}m`;
  }

  if (amount >= 1_000) {
    return `${trimCompact(amount / 1_000)}k`;
  }

  return String(Math.round(amount));
}

function trimCompact(value) {
  return value.toFixed(value >= 10 ? 0 : 1).replace(/\.0$/, "");
}

function buildProfitPoints(recentGames, startingBalance) {
  const chronologicalGames = [...recentGames].reverse();
  const deltas = [0];
  let runningProfit = 0;

  chronologicalGames.forEach((game) => {
    runningProfit += Number(game.profit || 0);
    deltas.push(runningProfit);
  });

  const maxAbs = Math.max(
    ...deltas.map((point) => Math.abs(point)),
    Math.max(Math.abs(startingBalance || 0) * 0.04, 100)
  );

  return deltas.map((point, index) => {
    const x = (index / Math.max(deltas.length - 1, 1)) * 100;
    const normalized = point / Math.max(maxAbs, 1);
    const y = 50 - normalized * 34;
    return { x, y };
  });
}

function buildSmoothProfitPath(points) {
  if (!points.length) {
    return "";
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = (current.x + next.x) / 2;

    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

function buildTrackerAreaPath(points, linePath) {
  if (!points.length) {
    return "";
  }

  const lastPoint = points[points.length - 1];
  return `${linePath} L ${lastPoint.x} 100 L ${points[0].x} 100 Z`;
}

function calculateWinStreak(recentGames) {
  let streak = 0;

  for (const game of recentGames) {
    if (game.profit > 0) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
}

function generateClientSeed() {
  return `donutdrop-${Math.random().toString(36).slice(2, 10)}`;
}

export function Dashboard() {
  const {
    token,
    user,
    recentGames,
    logout,
    refreshBalance,
    saveClientSeed,
    setUser,
    setRecentGames
  } = useAuth();
  const [activeView, setActiveView] = useState("lobby");
  const [activeTopTab, setActiveTopTab] = useState("");
  const [clientSeed, setClientSeed] = useState(user?.clientSeed || "");
  const [savingSeed, setSavingSeed] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState("");
  const [chatTimeoutUntil, setChatTimeoutUntil] = useState(0);
  const [chatCanModerate, setChatCanModerate] = useState(false);
  const [flaggedMessages, setFlaggedMessages] = useState([]);
  const [modForm, setModForm] = useState({ username: "", word: "" });
  const [customWords, setCustomWords] = useState([]);
  const [modMessage, setModMessage] = useState("");
  const [moderatingAction, setModeratingAction] = useState("");
  const [adminBalanceAmount, setAdminBalanceAmount] = useState("1m");
  const [adminPromoForm, setAdminPromoForm] = useState({ code: "", reward: "1b" });
  const [adminPromoCodes, setAdminPromoCodes] = useState([]);
  const [adminRainAmount, setAdminRainAmount] = useState("1m");
  const [players, setPlayers] = useState([]);
  const [tipForm, setTipForm] = useState({ username: "", amount: "100" });
  const [tipMessage, setTipMessage] = useState("");
  const [tipping, setTipping] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [redeemingPromo, setRedeemingPromo] = useState(false);
  const [affiliateInput, setAffiliateInput] = useState("");
  const [affiliateMessage, setAffiliateMessage] = useState("");
  const [affiliateLoading, setAffiliateLoading] = useState("");
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [walletStep, setWalletStep] = useState("wallet");
  const [walletTab, setWalletTab] = useState("deposit");
  const [minecraftUsername, setMinecraftUsername] = useState(user?.username || "");
  const [minecraftLinked, setMinecraftLinked] = useState(false);
  const [depositSession, setDepositSession] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletMessage, setWalletMessage] = useState("");
  const [cryptoAssets, setCryptoAssets] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [cryptoOrder, setCryptoOrder] = useState(null);
  const [cryptoTxHash, setCryptoTxHash] = useState("");
  const [cryptoUsdInput, setCryptoUsdInput] = useState("5.00");
  const [onlineCount, setOnlineCount] = useState(0);
  const [rain, setRain] = useState({ active: false, amount: 0, participants: 0, endTime: 0 });
  const [rainMessage, setRainMessage] = useState("");
  const [joiningRain, setJoiningRain] = useState(false);
  const [startingRain, setStartingRain] = useState(false);
  const [rainNow, setRainNow] = useState(Date.now());
  const [pendingLevelReward, setPendingLevelReward] = useState({ level: 0, amount: 0 });
  const [claimMessage, setClaimMessage] = useState("");
  const [claimingReward, setClaimingReward] = useState("");
  const [bonusView, setBonusView] = useState("overview");
  const [themeName, setThemeName] = useState(() => {
    if (typeof window === "undefined") {
      return "green";
    }

    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES[savedTheme] ? savedTheme : "green";
  });
  const [glowLevel, setGlowLevel] = useState(() => {
    if (typeof window === "undefined") {
      return 1;
    }

    const savedGlow = Number(window.localStorage.getItem(GLOW_STORAGE_KEY) || 1);
    return Number.isFinite(savedGlow) ? savedGlow : 1;
  });
  const [lightMode, setLightMode] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(DARK_STORAGE_KEY) === "light";
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.localStorage.getItem(SOUND_STORAGE_KEY) !== "off";
  });
  const [effectsEnabled, setEffectsEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.localStorage.getItem(EFFECTS_STORAGE_KEY) !== "off";
  });
  const availableCryptoAssets = cryptoAssets.length ? cryptoAssets : FALLBACK_CRYPTO_ASSETS;
  const selectedCryptoAsset =
    availableCryptoAssets.find((asset) => asset.symbol === selectedCrypto) || availableCryptoAssets[0];
  const level = user?.level || 1;
  const xp = user?.xp || 0;
  const xpRequired = user?.xpRequired || 500;
  const xpProgress = Math.min((xp / Math.max(xpRequired, 1)) * 100, 100);
  const nextLevelReward = (level + 1) * 50_000;
  const currentTheme = THEMES[themeName] || THEMES.green;
  const showAdminPanel =
    chatCanModerate && ["wer", "jaydon", "admin"].includes(String(user?.username || "").toLowerCase());

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    root.style.setProperty("--app-bg", currentTheme.bg);
    root.style.setProperty("--accent-solid", currentTheme.accent);
    root.style.setProperty("--accent-glow", `${currentTheme.accent}55`);
    root.style.setProperty("--accent-gradient", currentTheme.accentGradient);
    window.localStorage.setItem(THEME_STORAGE_KEY, themeName);
  }, [currentTheme, themeName]);

  useEffect(() => {
    if (!rain.active || !rain.endTime) {
      return undefined;
    }

    setRainNow(Date.now());
    const intervalId = window.setInterval(() => {
      setRainNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [rain.active, rain.endTime]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.style.setProperty("--glow", String(glowLevel));
    window.localStorage.setItem(GLOW_STORAGE_KEY, String(glowLevel));
  }, [glowLevel]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.classList.toggle("light", lightMode);
    window.localStorage.setItem(DARK_STORAGE_KEY, lightMode ? "light" : "dark");
  }, [lightMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SOUND_STORAGE_KEY, soundEnabled ? "on" : "off");
    window.dispatchEvent(
      new CustomEvent("donutdrop:settings", {
        detail: {
          soundEnabled,
          effectsEnabled
        }
      })
    );
  }, [soundEnabled, effectsEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(EFFECTS_STORAGE_KEY, effectsEnabled ? "on" : "off");
    window.dispatchEvent(
      new CustomEvent("donutdrop:settings", {
        detail: {
          soundEnabled,
          effectsEnabled
        }
      })
    );
  }, [effectsEnabled, soundEnabled]);

  useEffect(() => {
    setClientSeed(user?.clientSeed || "");
  }, [user?.clientSeed]);

  useEffect(() => {
    if (typeof window === "undefined" || !user?.id || !user?.level) {
      return;
    }

    const storageKey = `${LEVEL_REWARD_STORAGE_KEY}:${user.id}`;
    const stored = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
    const lastSeenLevel = Number(stored.lastSeenLevel || user.level);
    const pendingAmount = Number(stored.amount || 0);
    const pendingLevel = Number(stored.level || 0);

    if (user.level > lastSeenLevel) {
      const amount = pendingAmount + user.level * 50_000;
      const nextPending = {
        level: user.level,
        amount,
        lastSeenLevel: user.level
      };
      window.localStorage.setItem(storageKey, JSON.stringify(nextPending));
      setPendingLevelReward({ level: user.level, amount });
      return;
    }

    if (pendingAmount > 0) {
      setPendingLevelReward({ level: pendingLevel || user.level, amount: pendingAmount });
      return;
    }

    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        level: user.level,
        amount: 0,
        lastSeenLevel: user.level
      })
    );
    setPendingLevelReward({ level: 0, amount: 0 });
  }, [user?.id, user?.level]);

  useEffect(() => {
    let ignore = false;

    api.getRain(token)
      .then((data) => {
        if (!ignore && data?.rain) {
          setRain(data.rain);
        }
      })
      .catch(() => {});

    const socket = createAppSocket(user);

    socket.on("online:update", (data) => {
      setOnlineCount(Number(data?.count || 0));
    });

    socket.on("rain:start", (data) => {
      setRain({
        active: true,
        amount: Number(data.amount || 0),
        endTime: Number(data.endTime || 0),
        participants: 0
      });
      setRainMessage("Rain started. Join before it ends.");
    });

    socket.on("rain:update", (data) => {
      setRain((current) => ({
        ...current,
        participants: Number(data?.count || 0)
      }));
    });

    socket.on("rain:end", () => {
      setRain({ active: false, amount: 0, participants: 0, endTime: 0 });
      setRainMessage("Rain ended.");
    });

    socket.on("chat:message", (payload) => {
      if (payload?.type === "chat" && payload.message?.id) {
        setChatMessages((current) => {
          const next = [...current.filter((entry) => entry.id !== payload.message.id), payload.message];
          return next.slice(-60);
        });
      }

      if (payload?.type === "rain" && payload.message) {
        setChatMessages((current) => {
          const eventMessage = {
            id: `rain_${Date.now()}`,
            username: "system",
            text: payload.message,
            createdAt: new Date().toISOString()
          };
          return [...current, eventMessage].slice(-60);
        });
      }

      if (payload?.type === "tip" && payload.message?.id) {
        setChatMessages((current) => [...current, payload.message].slice(-60));
      }
    });

    return () => {
      ignore = true;
      socket.disconnect();
    };
  }, [token, user]);

  useEffect(() => {
    setMinecraftUsername(user?.minecraftUsername || user?.username || "");
    setMinecraftLinked(Boolean(user?.minecraftUsername));
  }, [user?.minecraftUsername, user?.username]);

  useEffect(() => {
    let cancelled = false;

    async function loadCryptoAssets() {
      if (!token) {
        return;
      }

      try {
        const data = await api.getCryptoAssets(token);
        if (!cancelled) {
          setCryptoAssets(data.assets?.length ? data.assets : FALLBACK_CRYPTO_ASSETS);
        }
      } catch {
        if (!cancelled) {
          setCryptoAssets(FALLBACK_CRYPTO_ASSETS);
        }
      }
    }

    loadCryptoAssets();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!walletOpen || walletTab !== "deposit" || !token || !selectedCryptoAsset || cryptoOrder) {
      return;
    }

    ensureCryptoOrder(selectedCryptoAsset.symbol);
  }, [cryptoOrder, selectedCryptoAsset, token, walletOpen, walletTab]);

  useEffect(() => {
    if (!walletOpen || walletStep !== "minecraft" || !depositSession?.id || depositSession.status !== "pending") {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const data = await api.getDepositSession(token, depositSession.id);
        setDepositSession(data.session);

        if (data.session.status === "completed") {
          setWalletMessage(`Deposit received: ${formatMoney(data.session.amount)}`);
          await refreshBalance();
        }
      } catch {
        // Quiet polling failure.
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [depositSession?.id, depositSession?.status, refreshBalance, token, walletOpen, walletStep]);

  useEffect(() => {
    if (!walletOpen || walletTab !== "deposit" || !cryptoOrder?.id || !["pending", "submitted"].includes(cryptoOrder.status)) {
      return undefined;
    }

    const intervalId = window.setInterval(async () => {
      try {
        const data = await api.getCryptoOrder(token, cryptoOrder.id);
        setCryptoOrder(data.order);

        if (data.order.status === "confirmed") {
          setWalletMessage(
            `Crypto deposit confirmed. ${data.order.donutCredit.toLocaleString()} Donut Money credited.`
          );
          await refreshBalance();
        }
      } catch {
        // Quiet polling failure.
      }
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, [cryptoOrder?.id, cryptoOrder?.status, refreshBalance, token, walletOpen, walletTab]);

  useEffect(() => {
    let cancelled = false;

    async function loadChat() {
      if (!token) {
        return;
      }

      try {
        const data = await api.getChat(token);
        if (!cancelled) {
          setChatMessages(data.messages || []);
          setChatTimeoutUntil(data.timeoutUntil || 0);
          setChatCanModerate(Boolean(data.canModerate));
          setFlaggedMessages(data.flaggedMessages || []);
          setChatError("");
        }
      } catch (error) {
        if (!cancelled) {
          setChatError(error.message);
        }
      }
    }

    loadChat();
    const intervalId = window.setInterval(loadChat, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function loadModerationWords() {
      if (!token || !chatCanModerate) {
        return;
      }

      try {
        const data = await api.getChatModerationWords(token);
        if (!cancelled) {
          setCustomWords(data.words || []);
        }
      } catch {
        if (!cancelled) {
          setCustomWords([]);
        }
      }
    }

    loadModerationWords();

    return () => {
      cancelled = true;
    };
  }, [chatCanModerate, token]);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminPromoCodes() {
      if (!token || !showAdminPanel) {
        if (!cancelled) {
          setAdminPromoCodes([]);
        }
        return;
      }

      try {
        const data = await api.getAdminPromoCodes(token);
        if (!cancelled) {
          setAdminPromoCodes(data.promoCodes || []);
        }
      } catch {
        if (!cancelled) {
          setAdminPromoCodes([]);
        }
      }
    }

    loadAdminPromoCodes();

    return () => {
      cancelled = true;
    };
  }, [showAdminPanel, token]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlayers() {
      if (!token) {
        return;
      }

      try {
        const data = await api.getPlayers(token);
        if (!cancelled) {
          setPlayers(data.players || []);
          setTipForm((current) => ({
            ...current,
            username: current.username || data.players?.[0]?.username || ""
          }));
        }
      } catch {
        if (!cancelled) {
          setPlayers([]);
        }
      }
    }

    loadPlayers();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function updateBalance(nextValue) {
    const balance =
      typeof nextValue === "object" && nextValue !== null ? nextValue.balance : nextValue;
    const shouldRefresh =
      typeof nextValue === "object" && nextValue !== null ? nextValue.refresh !== false : true;

    setUser((currentUser) => ({ ...currentUser, balance }));

    if (!shouldRefresh) {
      return;
    }

    try {
      const data = await refreshBalance();
      if (data?.recentGames) {
        setRecentGames(data.recentGames);
      }
    } catch {
      // Auth context clears invalid sessions already.
    }
  }

  async function handleSaveSeed() {
    setSavingSeed(true);
    setSeedMessage("");

    try {
      const nextUser = await saveClientSeed(clientSeed);
      setSeedMessage(`Client seed updated to "${nextUser.clientSeed}".`);
    } catch (error) {
      setSeedMessage(error.message);
    } finally {
      setSavingSeed(false);
    }
  }

  function handleRandomizeSeed() {
    setClientSeed(generateClientSeed());
    setSeedMessage("Random seed generated. Save it when you're ready.");
  }

  async function handleSendChat() {
    if (!chatInput.trim()) {
      return;
    }

    try {
      const data = await api.sendChat(token, { text: chatInput });
      setChatMessages(data.messages || []);
      setChatTimeoutUntil(data.timeoutUntil || 0);
      setFlaggedMessages(data.flaggedMessages || []);
      setChatInput("");
      setChatError("");
    } catch (error) {
      setChatError(error.message);
      const freshChat = await api.getChat(token).catch(() => null);
      if (freshChat) {
        setChatMessages(freshChat.messages || []);
        setChatTimeoutUntil(freshChat.timeoutUntil || 0);
        setFlaggedMessages(freshChat.flaggedMessages || []);
      }
    }
  }

  async function handleModerationAction(action, durationSeconds = 0) {
    if (!modForm.username.trim()) {
      setModMessage("Enter a username first.");
      return;
    }

    setModeratingAction(action);
    setModMessage("");

    try {
      const data = await api.moderateChatUser(token, {
        username: modForm.username.trim(),
        action,
        durationSeconds
      });
      setFlaggedMessages(data.flaggedMessages || []);
      setModMessage(`${data.target} ${action} applied.`);
    } catch (error) {
      setModMessage(error.message);
    } finally {
      setModeratingAction("");
    }
  }

  async function handleAddCustomWord() {
    if (!modForm.word.trim()) {
      setModMessage("Enter a custom word first.");
      return;
    }

    setModeratingAction("word-add");
    setModMessage("");

    try {
      const data = await api.addChatModerationWord(token, modForm.word.trim());
      setCustomWords(data.words || []);
      setModForm((current) => ({ ...current, word: "" }));
      setModMessage("Custom banned word added.");
    } catch (error) {
      setModMessage(error.message);
    } finally {
      setModeratingAction("");
    }
  }

  async function handleRemoveCustomWord(word) {
    setModeratingAction(`word-remove-${word}`);
    setModMessage("");

    try {
      const data = await api.removeChatModerationWord(token, word);
      setCustomWords(data.words || []);
      setModMessage(`Removed "${word}".`);
    } catch (error) {
      setModMessage(error.message);
    } finally {
      setModeratingAction("");
    }
  }

  async function handleAdminGiveBalance() {
    if (!modForm.username.trim()) {
      setModMessage("Enter a username first.");
      return;
    }

    setModeratingAction("give-balance");
    setModMessage("");

    try {
      const amount = parseBetInput(adminBalanceAmount);
      const data = await api.adminAdjustBalance(token, {
        username: modForm.username.trim(),
        amount
      });
      setModMessage(`Added ${formatMoney(data.amount)} to ${data.target.username}.`);
      if (String(data.target.username).toLowerCase() === String(user?.username || "").toLowerCase()) {
        setUser(data.target);
      }
    } catch (error) {
      setModMessage(error.message);
    } finally {
      setModeratingAction("");
    }
  }

  async function handleCreatePromoCode() {
    if (!adminPromoForm.code.trim()) {
      setModMessage("Enter a promo code first.");
      return;
    }

    setModeratingAction("promo-create");
    setModMessage("");

    try {
      const reward = parseBetInput(adminPromoForm.reward);
      const data = await api.createAdminPromoCode(token, {
        code: adminPromoForm.code.trim(),
        reward
      });
      setAdminPromoCodes(data.promoCodes || []);
      setAdminPromoForm({ code: "", reward: adminPromoForm.reward });
      setModMessage("Promo code added.");
    } catch (error) {
      setModMessage(error.message);
    } finally {
      setModeratingAction("");
    }
  }

  async function handleDeletePromoCode(promoId) {
    setModeratingAction(`promo-delete-${promoId}`);
    setModMessage("");

    try {
      const data = await api.deleteAdminPromoCode(token, promoId);
      setAdminPromoCodes(data.promoCodes || []);
      setModMessage("Promo code deleted.");
    } catch (error) {
      setModMessage(error.message);
    } finally {
      setModeratingAction("");
    }
  }

  async function handleTip() {
    setTipping(true);
    setTipMessage("");

    try {
      const amount = parseBetInput(tipForm.amount);
      const data = await api.tipUser(token, {
        username: tipForm.username,
        amount
      });
      setUser(data.user);
      setTipForm((current) => ({ ...current, amount: "100" }));
      setTipMessage(`Tipped ${data.recipient.username} ${formatMoney(data.amount)}.`);
    } catch (error) {
      setTipMessage(error.message);
    } finally {
      setTipping(false);
    }
  }

  async function handleRedeemPromo() {
    if (!promoCode.trim()) {
      return;
    }

    setRedeemingPromo(true);
    setPromoMessage("");

    try {
      const normalizedCode = promoCode.trim().toUpperCase();
      const data = await api.redeemPromoCode(token, { code: normalizedCode });
      setUser(data.user);
      setPromoCode("");
      setPromoMessage(`Redeemed ${normalizedCode} for ${formatMoney(data.amount)}.`);
      await refreshBalance();
    } catch (error) {
      setPromoMessage(error.message);
    } finally {
      setRedeemingPromo(false);
    }
  }

  function openRedeemCodeScreen() {
    setActiveTopTab("bonus");
    setActiveView("lobby");
    setBonusView("redeem");
    setPromoMessage("");
  }

  async function handleApplyAffiliate() {
    if (!affiliateInput.trim()) {
      return;
    }

    setAffiliateLoading("apply");
    setAffiliateMessage("");

    try {
      const data = await api.applyAffiliate(token, affiliateInput.trim());
      setUser(data.user);
      setAffiliateInput("");
      setAffiliateMessage(`Affiliate code ${data.user.affiliateCodeUsed} applied.`);
    } catch (error) {
      setAffiliateMessage(error.message);
    } finally {
      setAffiliateLoading("");
    }
  }

  async function handleClaimAffiliate() {
    setAffiliateMessage("Affiliate rewards credit instantly when someone uses your code.");
  }

  async function handleJoinRain() {
    setJoiningRain(true);
    setRainMessage("");

    try {
      const data = await api.joinRain(token);
      setRain(data.rain);
      setRainMessage("You joined the rain.");
    } catch (error) {
      setRainMessage(error.message);
    } finally {
      setJoiningRain(false);
    }
  }

  async function handleStartRain() {
    setStartingRain(true);
    setRainMessage("");

    try {
      const amount = showAdminPanel ? parseBetInput(adminRainAmount) : undefined;
      const data = await api.startRain(token, amount ? { amount } : {});
      setRain(data.rain);
      setRainMessage(
        amount ? `Rain launched live for ${formatMoney(amount)}.` : "Rain launched live."
      );
    } catch (error) {
      setRainMessage(error.message);
    } finally {
      setStartingRain(false);
    }
  }

  const totalProfit = recentGames.reduce((sum, game) => sum + game.profit, 0);
  const totalWagered = user.stats?.totalWagered ?? recentGames.reduce((sum, game) => sum + game.betAmount, 0);
  const rakebackBalance = Number(user?.rakebackBalance || 0);
  const onlineReward = Number(user?.onlineReward || 0);
  const affiliateCode = user?.affiliateCode || String(user?.username || "").toUpperCase();
  const affiliateCodeUsed = user?.affiliateCodeUsed || "";
  const affiliateAvailable = Number(user?.affiliateAvailable || 0);
  const affiliateEarned = Number(user?.affiliateEarned || 0);
  const gamesPlayed = recentGames.length;
  const winCount = recentGames.filter((game) => game.profit > 0).length;
  const biggestWin = user.stats?.biggestWin ?? recentGames.reduce((max, game) => Math.max(max, game.profit), 0);
  const winStreak = user.stats?.winStreak ?? calculateWinStreak(recentGames);
  const winRate = gamesPlayed ? ((winCount / gamesPlayed) * 100).toFixed(1) : "0.0";
  const profileStats = [
    { label: "🔥 Streak", value: String(winStreak), tone: "text-orange-300" },
    { label: "💰 Wagered", value: formatMoney(totalWagered), tone: "text-emerald-300" },
    { label: "🎯 Biggest Win", value: formatMoney(biggestWin), tone: "text-sky-300" }
  ];
  const trackerPoints = buildProfitPoints(recentGames, user.balance || 1000);
  const trackerPath = buildSmoothProfitPath(trackerPoints);
  const trackerAreaPath = buildTrackerAreaPath(trackerPoints, trackerPath);
  const activeTimeoutSeconds = Math.max(0, Math.ceil((chatTimeoutUntil - Date.now()) / 1000));
  const activeRainSeconds = Math.max(0, Math.ceil((Number(rain.endTime || 0) - rainNow) / 1000));
  const rainTimerLabel = `${Math.floor(activeRainSeconds / 60)}:${String(activeRainSeconds % 60).padStart(2, "0")}`;
  const timeoutLabel = useMemo(() => {
    const minutes = Math.floor(activeTimeoutSeconds / 60);
    const seconds = activeTimeoutSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }, [activeTimeoutSeconds]);
  const tipTargetExists = players.some(
    (player) => player.username.toLowerCase() === String(tipForm.username || "").trim().toLowerCase()
  );

  async function handleClaimReward(type) {
    setClaimingReward(type);
    setClaimMessage("");

    try {
      const data =
        type === "rakeback"
          ? await api.claimRakeback(token)
          : await api.claimOnlineReward(token);

      setUser(data.user);
      setClaimMessage(`+${formatMoney(data.amount)} added to wallet.`);
      await refreshBalance();
    } catch (error) {
      setClaimMessage(error.message);
    } finally {
      setClaimingReward("");
    }
  }

  async function handleClaimLevelReward() {
    if (!pendingLevelReward.amount) {
      return;
    }

    setClaimingReward("level");
    setClaimMessage("");

    try {
      const nextBalance = Number(user.balance || 0) + Number(pendingLevelReward.amount || 0);
      const data = await api.updateBalance(token, nextBalance);
      setUser((currentUser) => ({ ...currentUser, ...data.user }));

      if (typeof window !== "undefined" && user?.id) {
        window.localStorage.setItem(
          `${LEVEL_REWARD_STORAGE_KEY}:${user.id}`,
          JSON.stringify({
            level: user.level,
            amount: 0,
            lastSeenLevel: user.level
          })
        );
      }

      setPendingLevelReward({ level: 0, amount: 0 });
      setClaimMessage(`Claimed ${formatMoney(data.user.balance - user.balance)} from your level reward.`);
      await refreshBalance();
    } catch (error) {
      setClaimMessage(error.message);
    } finally {
      setClaimingReward("");
    }
  }

  function openWallet() {
    setWalletOpen(true);
    setWalletStep("wallet");
    setWalletTab("deposit");
    setWalletMessage("");
    setCryptoTxHash("");
    setCryptoUsdInput("5.00");
  }

  function closeWallet() {
    setWalletOpen(false);
    setWalletStep("wallet");
    setWalletMessage("");
  }

  async function ensureDepositSession() {
    if (depositSession?.status === "pending") {
      return;
    }

    setWalletLoading(true);
    setWalletMessage("");

    try {
      const data = await api.createDepositSession(token);
      setDepositSession(data.session);
    } catch (error) {
      setWalletMessage(error.message);
    } finally {
      setWalletLoading(false);
    }
  }

  async function handleLinkMinecraft() {
    setWalletLoading(true);
    setWalletMessage("");

    try {
      const data = await api.linkMinecraft(token, { minecraftUsername });
      setUser(data.user);
      setMinecraftLinked(true);
      setWalletMessage(`Minecraft linked as ${data.user.minecraftUsername}.`);
      const sessionData = await api.createDepositSession(token);
      setDepositSession(sessionData.session);
    } catch (error) {
      setWalletMessage(error.message);
    } finally {
      setWalletLoading(false);
    }
  }

  async function ensureCryptoOrder(symbol = selectedCrypto, usdAmountInput = cryptoUsdInput) {
    setWalletLoading(true);
    setWalletMessage("");

    try {
      const usdAmount = Math.max(5, Number(usdAmountInput) || 5);
      const data = await api.createCryptoOrder(token, { asset: symbol, usdAmount });
      setCryptoOrder(data.order);
      setCryptoTxHash(data.order.txHash || "");
    } catch (error) {
      setWalletMessage(error.message);
    } finally {
      setWalletLoading(false);
    }
  }

  async function handleSelectCrypto(symbol) {
    setSelectedCrypto(symbol);
    setCryptoOrder(null);
    setCryptoTxHash("");
    await ensureCryptoOrder(symbol, cryptoUsdInput);
  }

  async function handleSubmitCryptoHash() {
    if (!cryptoOrder?.id || !cryptoTxHash.trim()) {
      return;
    }

    setWalletLoading(true);
    setWalletMessage("");

    try {
      const data = await api.submitCryptoOrder(token, cryptoOrder.id, { txHash: cryptoTxHash.trim() });
      setCryptoOrder(data.order);
      setWalletMessage(data.message);
    } catch (error) {
      setWalletMessage(error.message);
    } finally {
      setWalletLoading(false);
    }
  }

  async function copyText(value, successMessage) {
    try {
      await navigator.clipboard.writeText(value);
      setWalletMessage(successMessage);
    } catch {
      setWalletMessage("Copy failed. Copy the value manually.");
    }
  }

  function openCryptoWallet() {
    setWalletStep("crypto");
    setWalletMessage("");
    setCryptoTxHash("");
    setCryptoOrder(null);
    ensureCryptoOrder(selectedCrypto, cryptoUsdInput);
  }

  function renderWalletModal() {
    if (!walletOpen) {
      return null;
    }

    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="w-full max-w-[720px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#141521] shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
        >
          {walletStep === "wallet" ? (
            <>
              <div className="border-b border-white/6 px-6 py-5">
                <h3 className="text-3xl font-black text-white">Wallet</h3>
              </div>

              <div className="space-y-6 px-6 py-6">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-2xl bg-white/5 p-2">
                    <button
                      type="button"
                      onClick={() => setWalletTab("deposit")}
                      className={`rounded-xl px-5 py-2 font-semibold transition ${
                        walletTab === "deposit" ? "bg-white/10 text-white" : "text-white/45"
                      }`}
                    >
                      Deposit
                    </button>
                    <button
                      type="button"
                      onClick={() => setWalletTab("withdraw")}
                      className={`rounded-xl px-5 py-2 font-semibold transition ${
                        walletTab === "withdraw" ? "bg-white/10 text-white" : "text-white/45"
                      }`}
                    >
                      Withdraw
                    </button>
                  </div>

                  <div className="ml-auto flex overflow-hidden rounded-2xl bg-white/5">
                    <input
                      value={promoCode}
                      onChange={(event) => setPromoCode(event.target.value)}
                      className="bg-transparent px-4 py-3 text-sm text-white outline-none"
                      placeholder="Promo code"
                    />
                    <button
                      type="button"
                      onClick={handleRedeemPromo}
                      disabled={redeemingPromo}
                      className="bg-white/10 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {redeemingPromo ? "Claiming..." : "Claim"}
                    </button>
                  </div>
                </div>
                {promoMessage && <p className="text-sm text-white/65">{promoMessage}</p>}

                {walletTab === "deposit" ? (
                  <>
                    <div>
                      <p className="text-lg font-semibold text-white">Minecraft In-Game</p>
                      <button
                        type="button"
                        onClick={async () => {
                          setWalletStep("minecraft");
                          if (minecraftLinked) {
                            await ensureDepositSession();
                          }
                        }}
                        className="mt-3 block w-full overflow-hidden rounded-[1.4rem] border border-yellow-400/10 bg-[linear-gradient(135deg,rgba(67,56,9,0.95),rgba(29,33,49,0.95))] text-left transition hover:border-yellow-300/20"
                      >
                        <div className="flex min-h-[132px] items-end bg-[radial-gradient(circle_at_left,rgba(250,204,21,0.18),transparent_28%),linear-gradient(90deg,rgba(0,0,0,0.05),rgba(0,0,0,0.35))] px-5 py-4">
                          <div>
                            <p className="text-2xl font-black text-white">DonutSMP</p>
                            <p className="mt-2 text-sm text-white/70">Deposit through the in-game Minecraft server.</p>
                          </div>
                        </div>
                      </button>
                    </div>

                    <div>
                      <p className="text-lg font-semibold text-white">Cryptocurrencies</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {availableCryptoAssets.map((asset) => (
                          <button
                            key={asset.symbol}
                            type="button"
                            onClick={async () => {
                              setSelectedCrypto(asset.symbol);
                              setWalletStep("crypto");
                              setCryptoOrder(null);
                              setCryptoTxHash("");
                              await ensureCryptoOrder(asset.symbol, cryptoUsdInput);
                            }}
                            className="overflow-hidden rounded-[1.4rem] border border-emerald-400/10 bg-[linear-gradient(135deg,rgba(8,20,36,0.98),rgba(21,24,37,0.98))] p-5 text-left transition hover:border-emerald-300/25 hover:bg-white/10"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-2xl font-black text-white">{asset.label}</p>
                                <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/45">{asset.symbol}</p>
                              </div>
                              <div className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                                Enabled
                              </div>
                            </div>
                            <p className="mt-4 text-sm text-white/60">Open a tracked {asset.label} deposit order.</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-[1.6rem] border border-white/6 bg-[#171824] p-6">
                    <p className="text-lg font-semibold text-white">Withdrawals</p>
                    <p className="mt-3 text-white/60">
                      Withdrawals will route through your linked Minecraft account once the deposit bot is enabled.
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-white/6 px-6 py-5">
                <button
                  type="button"
                  onClick={closeWallet}
                  className="rounded-xl bg-white/5 px-5 py-3 font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                  Close
                </button>
              </div>
            </>
          ) : walletStep === "crypto" ? (
            <>
              <div className="sticky top-0 z-10 border-b border-white/6 bg-[#141521] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-3xl font-black text-white">{selectedCryptoAsset?.label} Deposit</h3>
                    <p className="mt-2 text-white/60">Create a tracked crypto order and submit the transaction hash after payment.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWalletStep("wallet")}
                      className="rounded-xl bg-white/5 px-4 py-3 font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={closeWallet}
                      className="rounded-xl bg-white/5 px-4 py-3 font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>

              <div className="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {availableCryptoAssets.map((asset) => (
                    <button
                      key={asset.symbol}
                      type="button"
                      onClick={() => handleSelectCrypto(asset.symbol)}
                      className={`rounded-2xl px-4 py-4 text-left transition ${
                        selectedCrypto === asset.symbol
                          ? "border border-emerald-400/30 bg-emerald-500/10 text-white shadow-[0_0_24px_rgba(16,185,129,0.12)]"
                          : "bg-white/5 text-white/75 hover:bg-white/10"
                      }`}
                    >
                      <p className="font-semibold">{asset.label}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/45">{asset.symbol}</p>
                    </button>
                  ))}
                </div>

                <div className="rounded-[1.6rem] border border-emerald-400/15 bg-emerald-500/5 px-5 py-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">How Much To Spend (USD)</p>
                      <input
                        value={cryptoUsdInput}
                        onChange={(event) => setCryptoUsdInput(event.target.value)}
                        className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none"
                        placeholder="5.00"
                      />
                      <p className="mt-2 text-sm text-white/55">Minimum $5.00. Spend more if you want more Donut Money.</p>
                    </div>

                    <div className="rounded-2xl bg-black/20 px-4 py-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">Locked Order</p>
                      <p className="mt-2 text-xl font-bold text-white">${Number(cryptoOrder?.usdAmount || 0).toFixed(2)}</p>
                      <p className="mt-2 text-sm text-white/55">
                        Credit: {Number(cryptoOrder?.donutCredit || 0).toLocaleString()} Donut Money
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => ensureCryptoOrder(selectedCrypto, cryptoUsdInput)}
                      className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950"
                    >
                      Create / Refresh Order
                    </button>
                    <button
                      type="button"
                      onClick={() => copyText(cryptoOrder?.id || "", "Order id copied.")}
                      disabled={!cryptoOrder?.id}
                      className="rounded-xl bg-white/10 px-4 py-3 font-semibold text-white disabled:opacity-50"
                    >
                      Copy Order Id
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl bg-black/20 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">Deposit Address</p>
                      <p className="mt-2 break-all text-sm text-white/80">{selectedCryptoAsset?.address}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(selectedCryptoAsset?.address || "", "Deposit address copied.")}
                      className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl bg-black/20 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-white/45">Exact Amount Due</p>
                      <p className="mt-2 text-3xl font-bold text-white">
                        {cryptoOrder?.expectedAmount || "--"} {selectedCrypto}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(String(cryptoOrder?.expectedAmount || ""), "Exact crypto amount copied.")}
                      disabled={!cryptoOrder?.expectedAmount}
                      className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Copy Amount
                    </button>
                  </div>
                  <p className="mt-3 text-sm text-white/55">
                    The backend locks this amount to the current order so a fake browser claim cannot credit your balance.
                  </p>
                </div>

                <div className="rounded-2xl bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">Submit Transaction Hash</p>
                  <textarea
                    value={cryptoTxHash}
                    onChange={(event) => setCryptoTxHash(event.target.value)}
                    rows={4}
                    className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none"
                    placeholder={`Paste your ${selectedCrypto} transaction hash`}
                  />
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleSubmitCryptoHash}
                      disabled={!cryptoOrder?.id || walletLoading}
                      className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
                    >
                      {walletLoading ? "Submitting..." : "Submit Tx Hash"}
                    </button>
                    {cryptoOrder?.status === "submitted" && (
                      <div className="rounded-xl bg-amber-500/15 px-4 py-3 text-sm font-semibold text-amber-200">
                        Waiting for blockchain confirmation
                      </div>
                    )}
                    {cryptoOrder?.status === "confirmed" && (
                      <div className="rounded-xl bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-200">
                        Deposit confirmed
                      </div>
                    )}
                  </div>
                </div>

                {walletMessage && (
                  <div className="rounded-2xl bg-white/5 px-4 py-4 text-sm text-white/70">
                    {walletMessage}
                  </div>
                )}
              </div>

            </>
          ) : (
            <>
              <div className="border-b border-white/6 px-6 py-5">
                <h3 className="text-3xl font-black text-white">Deposit Guide</h3>
                <p className="mt-2 text-white/60">Follow these steps to complete your in-game deposit.</p>
              </div>

              <div className="space-y-6 px-6 py-6">
                <div className="rounded-[1.5rem] border border-emerald-500/20 bg-emerald-500/10 p-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(74,222,128,0.8)]" />
                    <p className="text-2xl font-bold text-emerald-300">Deposit Bot Online</p>
                  </div>
                  <p className="mt-3 text-white/70">
                    DonutSMP in-game deposits are available right now. You can change this status later whenever the bot goes offline.
                  </p>
                  <div className="mt-4 rounded-2xl bg-black/20 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-white/45">Minecraft Deposit Amount</p>
                    <p className="mt-2 text-4xl font-black tracking-[0.12em] text-white">
                      {depositSession?.requiredAmount || 950}
                    </p>
                    <p className="mt-2 text-sm text-white/55">
                      Pay exactly {depositSession?.requiredAmount || 950} in Minecraft money to qvde. Once the bot confirms that payment for the linked username, the website will credit your balance.
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-white/6 bg-[#171824] p-6">
                  <p className="text-white/75">
                    You need to link your Minecraft account before you can deposit. This connects your in-game identity for deposits and withdrawals on <span className="font-semibold text-white">DonutSMP</span>.
                  </p>

                  <label className="mt-5 block">
                    <span className="text-sm font-semibold text-white">Minecraft Username</span>
                    <input
                      value={minecraftUsername}
                      onChange={(event) => setMinecraftUsername(event.target.value)}
                      className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none"
                      placeholder="Your IGN"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleLinkMinecraft}
                    className="mt-5 w-full rounded-2xl bg-emerald-500 px-4 py-4 text-lg font-bold text-slate-950 transition hover:bg-emerald-400"
                  >
                    {walletLoading ? "Linking..." : "Link Minecraft Account"}
                  </button>

                  <p className="mt-4 text-sm text-white/55">
                    If you previously played with this Minecraft username, your balance and history will be restored.
                  </p>

                  {minecraftLinked && (
                    <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-200">
                      Minecraft account linked: <span className="font-semibold">{minecraftUsername || user.username}</span>
                    </div>
                  )}

                  {walletMessage && (
                    <div className="mt-4 rounded-2xl bg-white/5 px-4 py-4 text-sm text-white/70">
                      {walletMessage}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/6 px-6 py-5">
                <button
                  type="button"
                  onClick={() => setWalletStep("wallet")}
                  className="rounded-xl bg-white/5 px-5 py-3 font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={closeWallet}
                  className="rounded-xl bg-white/5 px-5 py-3 font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    );
  }

  function renderTopPanel() {
    if (activeTopTab === "bonus") {
      return (
        <section className="space-y-5">
          <div className="rounded-[2rem] border border-emerald-400/10 bg-[linear-gradient(180deg,rgba(28,47,36,0.96),rgba(17,18,29,0.96))] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-indigo-200/65">Bonus Center</p>
                <h2 className="mt-3 text-4xl font-black text-white">Claim Rewards</h2>
                <p className="mt-3 text-white/65">
                  30-minute, daily, weekly, monthly bonuses plus rakeback.
                </p>
              </div>
              <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/75">
                Total Claimed: {formatMoney(Math.max(totalProfit, 0))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setBonusView("overview")}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                bonusView === "overview"
                  ? "bg-white/10 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              Rewards
            </button>
            <button
              type="button"
              onClick={() => setBonusView("redeem")}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                bonusView === "redeem"
                  ? "bg-emerald-500/15 text-emerald-100"
                  : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              Redeem Code
            </button>
          </div>

          {bonusView === "redeem" && (
            <div className="grid gap-5 lg:grid-cols-[1.25fr,0.85fr]">
              <div className="reward-box rounded-[1.8rem] border border-emerald-300/10 bg-[#171824] p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/60">Redeem Code</p>
                <h3 className="mt-4 text-3xl font-black text-white">Enter code that you want to redeem:</h3>
                <p className="mt-3 text-white/60">
                  Promo rewards credit straight into your wallet as soon as the code is valid.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={promoCode}
                    onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
                    className="casino-input flex-1"
                    placeholder="ENTER CODE"
                  />
                  <button
                    type="button"
                    onClick={handleRedeemPromo}
                    disabled={redeemingPromo || !promoCode.trim()}
                    className="claim-btn glow rounded-2xl px-6 py-3 font-semibold text-slate-950 disabled:opacity-50"
                  >
                    {redeemingPromo ? "Redeeming..." : "Redeem"}
                  </button>
                </div>
                {promoMessage && <p className="mt-4 text-sm text-white/70">{promoMessage}</p>}
              </div>

              <div className="rounded-[1.8rem] border border-white/6 bg-[#171824] p-6">
                <p className="text-sm uppercase tracking-[0.2em] text-indigo-200/70">How It Works</p>
                <div className="mt-5 space-y-4 text-white/65">
                  <div className="rounded-xl bg-black/20 px-5 py-4">
                    Enter your code exactly as you received it.
                  </div>
                  <div className="rounded-xl bg-black/20 px-5 py-4">
                    Valid rewards go directly into your wallet balance.
                  </div>
                  <div className="rounded-xl bg-black/20 px-5 py-4">
                    Each code can only be claimed once per account.
                  </div>
                </div>
              </div>
            </div>
          )}

          {bonusView === "overview" && (
            <>

          <div className="grid gap-4 xl:grid-cols-4">
            {[
              { label: "Online Reward", amount: onlineReward, meta: "Accumulates automatically while you stay online." },
              { label: "Rakeback", amount: rakebackBalance, meta: "Earn 1% back on every wager placed across games." },
              { label: "Total Wagered", amount: totalWagered, meta: "Tracked server-side and used for progression." },
              { label: "Net Profit", amount: Math.max(totalProfit, 0), meta: "Your best positive session flow so far." }
            ].map((bonus) => (
              <div key={bonus.label} className="reward-box rounded-[1.8rem] border border-white/6 bg-[#171824] p-6">
                <p className="text-sm uppercase tracking-[0.04em] text-indigo-200/70">{bonus.label}</p>
                <p className="mt-4 text-4xl font-black text-white">{formatMoney(bonus.amount)}</p>
                <p className="mt-4 min-h-[52px] text-sm leading-6 text-white/60">{bonus.meta}</p>
                <div className="mt-4 rounded-xl bg-black/20 px-4 py-3 text-sm text-white/55">
                  {bonus.label === "Online Reward" ? "Updates every minute of active time." : "Stored live on your account."}
                </div>
                <button
                  type="button"
                  disabled
                  className="claim-btn mt-4 w-full rounded-xl px-4 py-3 font-semibold text-slate-950 opacity-60"
                >
                  Passive
                </button>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.6fr,1fr]">
            <div className="reward-box rounded-[1.8rem] border border-white/6 bg-[#171824] p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-200/70">Rakeback</p>
              <div className="mt-4 rounded-xl bg-black/20 px-4 py-3 text-sm text-white/65">
                Rakeback rate: 1% of every bet, credited server-side as you wager.
              </div>
              <div className="mt-5 rounded-[1.4rem] border border-white/6 bg-[#11121a] p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-white/45">Available Rakeback</p>
                <p className="mt-3 text-4xl font-black text-white">{formatMoney(rakebackBalance)}</p>
                <p className="mt-3 text-sm text-white/55">
                  Claim any time and it goes straight into your wallet.
                </p>
              </div>
            </div>

            <div className="reward-box rounded-[1.8rem] border border-white/6 bg-[#171824] p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-white/45">Claim Center</p>
              <p className="mt-4 text-white/80">Wallet: {formatMoney(user.balance)}</p>
              <button
                type="button"
                onClick={() => handleClaimReward("rakeback")}
                disabled={claimingReward !== "" || rakebackBalance <= 0}
                className="claim-btn glow mt-5 w-full rounded-xl px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
              >
                {claimingReward === "rakeback" ? "Claiming..." : "Claim Rakeback"}
              </button>
              <button
                type="button"
                onClick={() => handleClaimReward("online")}
                disabled={claimingReward !== "" || onlineReward <= 0}
                className="claim-btn glow mt-3 w-full rounded-xl px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
              >
                {claimingReward === "online" ? "Claiming..." : "Claim Online Reward"}
              </button>
              {claimMessage && <p className="mt-4 text-sm text-white/70">{claimMessage}</p>}
            </div>
          </div>
            </>
          )}
        </section>
      );
    }

    if (activeTopTab === "leaderboard") {
      const leaderboard = [
        { name: user.username, wagered: totalWagered || 1260, rank: 1 },
        { name: "Wild Fire", wagered: 1160, rank: 2 },
        { name: "Pure Fire", wagered: 860, rank: 3 },
        { name: "Elite Arrow", wagered: 630, rank: 4 },
        { name: "Cool Phoenix", wagered: 520, rank: 5 }
      ];

      return (
        <section className="space-y-5">
          <div className="rounded-[2rem] border border-emerald-400/10 bg-[linear-gradient(180deg,rgba(20,34,28,0.96),rgba(18,19,28,0.96))] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-4xl font-black text-white">Top Players</h2>
                <p className="mt-3 text-white/65">Daily, weekly, and monthly legends battling for #1.</p>
              </div>
              <div className="flex rounded-2xl bg-white/5 p-2 text-sm">
                {["Daily", "Weekly", "Monthly"].map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    className={`rounded-xl px-4 py-2 ${index === 0 ? "bg-white/10 text-white" : "text-white/50"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {leaderboard.slice(0, 3).map((entry, index) => (
              <div
                key={entry.name}
                className={`rounded-[1.8rem] border p-6 ${
                  index === 0
                    ? "border-emerald-400/20 bg-[linear-gradient(180deg,rgba(29,72,49,0.5),rgba(18,19,28,0.95))]"
                    : "border-white/6 bg-[#171824]"
                }`}
              >
                <p className="rounded-xl bg-white/5 px-3 py-2 text-sm text-indigo-100/75">#{entry.rank}</p>
                <h3 className="mt-6 text-4xl font-black text-white">{entry.name}</h3>
                <p className="mt-5 text-xs uppercase tracking-[0.25em] text-white/45">Wagered</p>
                <p className="mt-2 text-3xl font-black text-sky-100">${entry.wagered.toFixed(2)}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[1.8rem] border border-white/6 bg-[#151622] p-6">
            <div className="grid grid-cols-[100px,1fr,160px] border-b border-white/6 pb-4 text-sm uppercase tracking-[0.2em] text-white/40">
              <span>Rank</span>
              <span>Player</span>
              <span>Wagered</span>
            </div>
            <div className="divide-y divide-white/6">
              {leaderboard.map((entry) => (
                <div key={entry.rank} className="grid grid-cols-[100px,1fr,160px] py-4 text-white/85">
                  <span className="font-semibold">#{entry.rank}</span>
                  <span>{entry.name}</span>
                  <span>${entry.wagered.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (activeTopTab === "fairness") {
      return (
        <section className="space-y-5">
          <div className="rounded-[2rem] border border-emerald-400/10 bg-[linear-gradient(180deg,rgba(24,36,30,0.96),rgba(20,21,30,0.96))] p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-indigo-200/65">Provably Fair</p>
            <h2 className="mt-3 text-4xl font-black text-white">Provably Fair</h2>
            <p className="mt-3 text-white/65">
              Ensuring every game outcome is transparent and verifiable.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[320px,1fr]">
            <section className="glass-panel rounded-[2rem] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">Client Seed Control</p>
              <div className="mt-4 flex items-center gap-2">
                <input
                  value={clientSeed}
                  onChange={(event) => setClientSeed(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-accent"
                  placeholder="Enter client seed"
                />
                <button
                  type="button"
                  onClick={handleRandomizeSeed}
                  className="glow h-10 w-10 shrink-0 rounded-full border border-white/10 bg-white/10 text-sm font-semibold text-white transition hover:bg-white/15"
                  title="Generate random seed"
                  aria-label="Generate random seed"
                >
                  ↻
                </button>
              </div>
              <button
                type="button"
                onClick={handleSaveSeed}
                disabled={savingSeed}
                className="mt-3 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-50"
              >
                {savingSeed ? "Saving..." : "Save seed"}
              </button>
              {seedMessage && <p className="mt-3 text-sm text-white/60">{seedMessage}</p>}
            </section>

            <FairnessCard
              title="How DonutDrop verifies rounds"
              data={{
                serverSeedHash: "Shown before play so the hidden server seed is committed in advance.",
                clientSeed: `Current player seed: ${clientSeed || "donutdrop-default"}`,
                nonce: `Current nonce: ${user.nonce}`,
                formula: "SHA256(serverSeed:clientSeed:nonce) generates deterministic game randomness."
              }}
            />
          </div>
        </section>
      );
    }

    if (activeTopTab === "affiliate") {
      const referralLink = `https://donut-drops.com/?ref=${affiliateCode}`;
      const usersReferred = players.filter(
        (player) => String(player.affiliateCodeUsed || "").toUpperCase() === affiliateCode
      ).length;

      return (
        <section className="space-y-5">
          <div className="rounded-[1.8rem] border border-white/6 bg-[#171824] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-200/70">Affiliate</p>
            <div className="mt-5 grid gap-4 xl:grid-cols-4">
              {[
                { label: "Reward Per Referral", value: "5m" },
                { label: "Users Referred", value: String(usersReferred) },
                { label: "Total Rewards", value: `${(affiliateEarned / 1_000_000).toFixed(affiliateEarned >= 10_000_000 ? 0 : 1).replace(/\\.0$/, "")}m` },
                { label: "Unlock Rule", value: "5m wagered" }
              ].map((card) => (
                <div key={card.label} className="rounded-[1.3rem] border border-white/6 bg-[#11121a] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/45">{card.label}</p>
                  <p className="mt-3 text-3xl font-black text-white">{card.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.7fr,320px]">
            <div className="rounded-[1.8rem] border border-white/6 bg-[#171824] p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-200/70">Your Referral</p>

              <label className="mt-5 block">
                <span className="text-sm font-semibold text-white">Referral Code</span>
                <div className="mt-3 rounded-xl bg-black/20 px-5 py-4 text-white">{affiliateCode}</div>
              </label>

              <label className="mt-5 block">
                <span className="text-sm font-semibold text-white">Referral Link</span>
                <div className="mt-3 rounded-xl bg-black/20 px-5 py-4 text-white">{referralLink}</div>
              </label>

              <div className="mt-5 rounded-xl bg-black/20 px-5 py-4 text-white/65">
                Each time a new player applies your code and uses more than 5m, you get a 5m reward added to your site balance.
              </div>
              <div className="mt-5 flex gap-3">
                <input
                  value={affiliateInput}
                  onChange={(event) => setAffiliateInput(event.target.value)}
                  className="w-full rounded-xl bg-black/20 px-5 py-4 text-white outline-none"
                  placeholder={affiliateCodeUsed ? `Applied: ${affiliateCodeUsed}` : "Enter affiliate code"}
                  disabled={Boolean(affiliateCodeUsed)}
                />
                <button
                  type="button"
                  onClick={handleApplyAffiliate}
                  disabled={affiliateLoading !== "" || Boolean(affiliateCodeUsed)}
                  className="claim-btn rounded-xl px-5 py-4 disabled:opacity-50"
                >
                  {affiliateLoading === "apply" ? "Applying..." : affiliateCodeUsed ? "Applied" : "Apply"}
                </button>
              </div>
              {affiliateMessage && <p className="mt-4 text-sm text-white/65">{affiliateMessage}</p>}
            </div>

            <div className="rounded-[1.8rem] border border-white/6 bg-[#171824] p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-200/70">Instant Rewards</p>
              <div className="mt-5 rounded-[1.3rem] bg-[#11121a] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Latest Reward Rule</p>
                <p className="mt-3 text-4xl font-black text-white">5m</p>
              </div>
              <button
                type="button"
                onClick={handleClaimAffiliate}
                className="claim-btn glow mt-5 w-full rounded-xl px-4 py-3 font-semibold text-slate-950"
              >
                How It Works
              </button>
              <p className="mt-4 text-sm leading-6 text-white/55">
                There is no claim step now. Rewards go straight into your balance once that referred player passes 5m wagered.
              </p>
            </div>
          </div>
        </section>
      );
    }

    if (activeTopTab === "profile") {
      return (
        <section className="space-y-5">
          <div className="rounded-[1.8rem] border border-white/6 bg-[#171824] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-200/70">Profile</p>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#11121a] text-3xl font-black text-white">
                {user.username?.charAt(0)?.toUpperCase() || "D"}
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">{user.username}</h2>
                <p className="text-white/60">@{user.username}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-emerald-500 px-3 py-1 font-semibold text-slate-950">
                    Level {level}
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-white/65">
                    ${totalWagered.toFixed(2)} wagered
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-5 grid gap-4 md:grid-cols-3">
                {[
                  { label: "Win Streak", value: String(winStreak), accent: "text-orange-300", icon: "🔥" },
                  { label: "Total Wagered", value: formatMoney(totalWagered), accent: "text-emerald-300", icon: "💰" },
                  { label: "Biggest Win", value: formatMoney(biggestWin), accent: "text-sky-300", icon: "🎯" }
                ].map((card) => (
                  <div key={card.label} className="rounded-[1.3rem] border border-white/6 bg-[#11121a] p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                      {card.icon} {card.label}
                    </p>
                    <p className={`mt-3 text-3xl font-black ${card.accent}`}>{card.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-white/60">
                <span>Progress to Level {level + 1}</span>
                <span>{Math.max(xpRequired - xp, 0)} XP remaining</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 via-amber-300 to-emerald-400 transition-all duration-700"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-white/55">
                <span>{xp} / {xpRequired} XP this level</span>
                <span>{xpProgress.toFixed(0)}% complete</span>
              </div>
              <div className="mt-4 rounded-2xl border border-orange-400/15 bg-orange-400/10 px-4 py-3 text-sm text-orange-100">
                Next level reward preview: ${nextLevelReward.toLocaleString()}
              </div>
              <div className="mt-4 rounded-[1.4rem] border border-emerald-300/15 bg-emerald-400/10 p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-emerald-100/60">Level Reward</p>
                <p className="mt-3 text-3xl font-black text-emerald-300">
                  {pendingLevelReward.amount > 0 ? formatMoney(pendingLevelReward.amount) : "$0.00"}
                </p>
                <p className="mt-3 text-sm text-white/70">
                  {pendingLevelReward.amount > 0
                    ? `Level ${pendingLevelReward.level} reward is ready. Claim it here whenever you want.`
                    : "No level rewards are waiting right now. Your next one will stay here until you claim it."}
                </p>
                <button
                  type="button"
                  onClick={handleClaimLevelReward}
                  disabled={claimingReward !== "" || pendingLevelReward.amount <= 0}
                  className="claim-btn glow mt-4 w-full rounded-xl px-4 py-3 font-semibold text-slate-950 disabled:opacity-50"
                >
                  {claimingReward === "level" ? "Claiming..." : "Claim Level Reward"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-white/6 bg-[#171824] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-200/70">Account</p>
            <div className="mt-4 flex flex-wrap gap-2 rounded-2xl bg-white/5 p-2 text-sm">
              {["Stats", "Game History", "Transactions", "Preferences", "Security"].map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  className={`rounded-xl px-4 py-2 ${index === 0 ? "bg-white/10 text-white" : "text-white/50"}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-4">
              {[
                { label: "Lifetime Wagered", value: `$${totalWagered.toFixed(2)}` },
                { label: "Games Played", value: String(gamesPlayed) },
                { label: "Win Rate", value: `${winRate}%` },
                { label: "Biggest Win", value: formatMoney(biggestWin) }
              ].map((card) => (
                <div key={card.label} className="rounded-[1.3rem] border border-white/6 bg-[#11121a] p-5">
                  <p className="text-sm text-white/45">{card.label}</p>
                  <p className="mt-3 text-4xl font-black text-white">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl bg-black/20 px-5 py-4 text-white/60">
              {gamesPlayed === 0
                ? "No games played yet. Start playing to see your stats here."
                : "Your account stats update live as you play across DonutDrop."}
            </div>
          </div>
        </section>
      );
    }

    if (activeTopTab === "store") {
      return (
        <section className="space-y-5">
          <div className="rounded-[2rem] border border-amber-400/10 bg-[linear-gradient(180deg,rgba(49,38,10,0.68),rgba(20,21,30,0.96))] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-indigo-200/65">Marketplace</p>
                <h2 className="mt-3 text-4xl font-black text-yellow-300">Store</h2>
                <p className="mt-3 text-white/65">Purchase Donut Money and redeem codes.</p>
              </div>
              <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-4 py-3 text-sm font-semibold text-yellow-200">
                Rate: $0.058 per million
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[460px,1fr]">
            <div className="rounded-[1.8rem] border border-white/6 bg-[#171824] p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-200/70">Buy Donut Money</p>
              <div className="mt-5 overflow-hidden rounded-[1.4rem] bg-[linear-gradient(135deg,rgba(70,30,8,0.95),rgba(23,38,28,0.95))] p-5">
                <div className="rounded-[1rem] bg-black/15 p-5">
                  <p className="text-4xl font-black uppercase tracking-[0.05em] text-lime-300">Donut Store</p>
                  <p className="mt-10 text-sm text-white/65">Instant top-ups for Mines, Dice, and the full lobby.</p>
                </div>
              </div>

              <p className="mt-5 text-white/65">
                Purchase coins instantly with Bitcoin, CashApp, PayPal, or Credit Card.
              </p>

              <div className="mt-5 flex gap-3 text-sm font-semibold text-white/65">
                {["BTC", "Card", "CashApp", "PayPal"].map((method) => (
                  <div key={method} className="rounded-xl bg-white/5 px-3 py-2">
                    {method}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={openWallet}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-yellow-300 to-amber-400 px-4 py-4 text-lg font-bold text-slate-950"
              >
                Purchase
              </button>
              <button
                type="button"
                onClick={openRedeemCodeScreen}
                className="mt-3 w-full rounded-xl bg-white/5 px-4 py-4 text-sm font-semibold text-white"
              >
                Redeem Code
              </button>
            </div>

            <div className="rounded-[1.8rem] border border-white/6 bg-[#171824] p-6">
              <h3 className="text-2xl font-bold text-white">Store Notes</h3>
              <div className="mt-5 space-y-4 text-white/65">
                <div className="rounded-xl bg-black/20 px-5 py-4">
                  Wallet deposits are staged to feel instant in the lobby once payment clears.
                </div>
                <div className="rounded-xl bg-black/20 px-5 py-4">
                  Promo codes redeem in the Bonus hub, and this button jumps you there instantly.
                </div>
                <div className="rounded-xl bg-black/20 px-5 py-4">
                  This section is now clickable and styled like a real marketplace instead of a dead header.
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    return null;
  }

  function renderMainPanel() {
    if (topNavItems.some((item) => item.toLowerCase() === activeTopTab)) {
      return renderTopPanel();
    }

    if (activeView === "mines") {
      return (
        <MinesGame
          token={token}
          user={user}
          onBalanceChange={updateBalance}
        />
      );
    }

    if (activeView === "dice") {
      return (
        <DiceGame
          token={token}
          user={user}
          onBalanceChange={updateBalance}
        />
      );
    }

    if (activeView === "blackjack") {
      return (
        <BlackjackGame
          token={token}
          onBalanceChange={updateBalance}
          onBack={() => setActiveView("lobby")}
        />
      );
    }

    if (activeView === "chicken") {
      return (
        <ChickenGame
          token={token}
          onBalanceChange={updateBalance}
          onBack={() => setActiveView("lobby")}
        />
      );
    }

    if (activeView === "roulette") {
      return (
        <RouletteGame
          token={token}
          user={user}
          onBalanceChange={updateBalance}
          onBack={() => setActiveView("lobby")}
        />
      );
    }

    if (activeView === "limbo") {
      return (
        <LimboGame
          token={token}
          user={user}
          onBalanceChange={updateBalance}
          onBack={() => setActiveView("lobby")}
        />
      );
    }

    if (activeView === "plinko") {
      return (
        <PlinkoGame
          token={token}
          user={user}
          onBalanceChange={updateBalance}
          onBack={() => setActiveView("lobby")}
        />
      );
    }

    if (activeView === "crash") {
      return (
        <CrashGame
          token={token}
          user={user}
          onBalanceChange={updateBalance}
          onBack={() => setActiveView("lobby")}
        />
      );
    }

    if (activeView !== "lobby") {
      return (
        <ArcadeGame
          token={token}
          gameType={activeView}
          user={user}
          onBalanceChange={updateBalance}
          onBack={() => setActiveView("lobby")}
        />
      );
    }

    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <section className="casino-card overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,rgba(255,122,0,0.28),transparent_26%),radial-gradient(circle_at_right,rgba(168,85,247,0.24),transparent_22%),linear-gradient(135deg,#122238,#172554_42%,#3b1904_100%)] p-6 shadow-[0_24px_80px_rgba(59,130,246,0.15)]">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-orange-200">Welcome</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
              High-stakes motion, live games, and a cleaner DonutDrop lobby.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/72">
              Move between Mines, Dice, and the rest of the floor with a sharper visual system, richer
              glow, and faster game switching.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTopTab("");
                setActiveView("mines");
              }}
              className="neon-button-green mt-6"
            >
              Start Playing
            </button>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-white">Games</h3>
            <p className="text-sm text-white/45">Choose a game from the lobby</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {gameCards.map((game) => (
              <GameCard
                key={game.id}
                title={game.label}
                players={game.players}
                image={game.image}
                accent={game.accent}
                onClick={() => {
                  setActiveTopTab("");
                  setActiveView(game.id);
                }}
              />
            ))}
          </div>
        </section>
      </motion.div>
    );
  }

  return (
    <div className="relative flex min-h-[88vh] w-full gap-4 xl:gap-5">
      <ThemeEffects accentColor={currentTheme.accent} />
      {renderWalletModal()}

      {trackerOpen && (
        <motion.div
          drag
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-6 left-[260px] z-30 w-[290px] cursor-grab rounded-[1.6rem] border border-cyan-400/15 bg-[#102536]/95 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl active:cursor-grabbing"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">Stake Loss Calculator</p>
              <p className="mt-1 text-sm text-white/65">Drag me anywhere.</p>
            </div>
            <button
              type="button"
              onClick={() => setTrackerOpen(false)}
              className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/75"
            >
              Close
            </button>
          </div>

          <div className="mt-4 rounded-[1.3rem] bg-[#0c1c2a] p-3">
            <svg viewBox="0 0 100 100" className="h-28 w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trackerStrokeMini" x1="0%" x2="100%" y1="0%" y2="0%">
                  <stop offset="0%" stopColor={totalProfit >= 0 ? "#6ee7b7" : "#fb7185"} />
                  <stop offset="100%" stopColor={totalProfit >= 0 ? "#22c55e" : "#ff4d6d"} />
                </linearGradient>
                <linearGradient id="trackerFillMini" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor={totalProfit >= 0 ? "rgba(110,231,183,0.28)" : "rgba(255,77,109,0.24)"} />
                  <stop offset="100%" stopColor="rgba(255,77,109,0)" />
                </linearGradient>
                <filter id="trackerGlowMini" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path d={trackerAreaPath} fill="url(#trackerFillMini)" opacity="0.9" />
              <path
                d={trackerPath}
                fill="none"
                stroke="url(#trackerStrokeMini)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#trackerGlowMini)"
              />
            </svg>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-black/20 p-3">
              <p className="text-white/45">Balance</p>
              <p className="mt-1 font-bold text-white">{formatMoney(user.balance)}</p>
            </div>
            <div className="rounded-xl bg-black/20 p-3">
              <p className="text-white/45">Net</p>
              <p className={`mt-1 font-bold ${totalProfit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                {totalProfit >= 0 ? "+" : "-"}{formatMoney(Math.abs(totalProfit))}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <aside className="glass-panel hidden w-[190px] shrink-0 rounded-[2rem] py-6 xl:block">
        <div className="px-6">
          <p className="text-3xl font-black text-white">
            Donut<span className="text-accent">Drop</span>
          </p>
        </div>
        <div className="mt-8 border-t border-white/5 px-3 pt-6">
          <button
            type="button"
            onClick={() => {
              setActiveTopTab("");
              setActiveView("lobby");
            }}
            className={`mb-2 w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
              activeView === "lobby" && !activeTopTab
                ? "bg-emerald-500/15 text-emerald-100"
                : "bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
            }`}
          >
            Home
          </button>
          <button
            type="button"
            onClick={() => setTrackerOpen((current) => !current)}
            className={`mb-4 w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
              trackerOpen
                ? "bg-cyan-500/15 text-cyan-100"
                : "bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
            }`}
          >
            Stake Loss Calculator
          </button>
          <p className="px-3 text-xs uppercase tracking-[0.35em] text-white/35">Games</p>
          <div className="mt-4 space-y-1">
            {sideGames.map((game) => {
              const normalized = game.toLowerCase().replace(/\s+/g, "-");
              const isActive =
                (normalized === "mines" && activeView === "mines") ||
                (normalized === "dice" && activeView === "dice");

              return (
                <button
                  key={game}
                  type="button"
                  onClick={() => {
                    setActiveTopTab("");
                    setActiveView(normalized);
                  }}
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/65 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {game}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 space-y-5">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-[2rem] px-6 py-5"
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex flex-wrap gap-2 text-sm text-white/55">
                {topNavItems.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setActiveTopTab(item.toLowerCase());
                      setActiveView("lobby");
                      if (item.toLowerCase() === "bonus") {
                        setBonusView("overview");
                      }
                    }}
                    className={`rounded-xl px-4 py-2 transition ${
                      activeTopTab === item.toLowerCase()
                        ? "bg-white/10 text-yellow-300"
                        : "bg-white/5 text-white/55 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <h1 className="mt-4 text-3xl font-semibold text-white">
                {topNavItems.some((item) => item.toLowerCase() === activeTopTab)
                  ? `${activeTopTab.charAt(0).toUpperCase() + activeTopTab.slice(1)} hub`
                  : activeView === "lobby"
                  ? "Casino lobby with playable games"
                  : `${activeView.charAt(0).toUpperCase() + activeView.slice(1)} table`}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                {Object.entries(THEMES).map(([name, theme]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setThemeName(name)}
                    className={`theme-chip rounded-full px-3 py-2 text-xs font-semibold text-white/80 transition hover:scale-105 ${
                      themeName === name ? "theme-chip-active text-white" : "bg-white/5"
                    }`}
                    style={{
                      background: themeName === name ? theme.accentGradient : undefined
                    }}
                    title={`${theme.label} theme`}
                  >
                    {theme.label}
                  </button>
                ))}
              </div>
              <div className="glow flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <label htmlFor="glowSlider" className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                  Glow
                </label>
                <input
                  id="glowSlider"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={glowLevel}
                  onChange={(event) => setGlowLevel(Number(event.target.value))}
                  className="accent-accent w-24"
                />
                <span className="w-8 text-right text-sm font-semibold text-white/75">{glowLevel.toFixed(1)}</span>
              </div>
              <button
                type="button"
                onClick={() => setLightMode((current) => !current)}
                className="glow rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
              >
                {lightMode ? "🌙 Dark" : "☀ Light"}
              </button>
              <button
                type="button"
                onClick={() => setSoundEnabled((current) => !current)}
                className="glow rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
              >
                {soundEnabled ? "🔊 Sounds" : "🔇 Sounds"}
              </button>
              <button
                type="button"
                onClick={() => setEffectsEnabled((current) => !current)}
                className="glow rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
              >
                {effectsEnabled ? "✨ Effects" : "🚫 Effects"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTopTab("");
                  setActiveView("lobby");
                }}
                className="rounded-2xl border border-white/10 px-5 py-4 text-white/75 transition hover:border-white/25 hover:text-white"
              >
                Home
              </button>
              <WalletDisplay balance={user.balance} />
              <button
                type="button"
                onClick={openWallet}
                className="rounded-2xl bg-emerald-500 px-5 py-4 font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Wallet
              </button>
              <div className="relative flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setActiveTopTab("profile");
                    setActiveView("lobby");
                  }}
                  className="rounded-2xl bg-white/5 px-5 py-4 font-medium text-white transition hover:bg-white/10"
                >
                  {user.username}
                </button>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((current) => !current)}
                  className="rounded-2xl bg-white/5 px-3 py-4 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
                  aria-label="Open profile menu"
                >
                  v
                </button>
                <AnimatePresence>
                  {profileMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-72 rounded-[1.6rem] border border-white/10 bg-[#0f172a]/95 p-4 shadow-[0_30px_80px_rgba(15,23,42,0.55)] backdrop-blur-xl"
                    >
                      <p className="text-xs uppercase tracking-[0.28em] text-white/40">Player Profile</p>
                      <p className="mt-3 text-xl font-semibold text-white">{user.username}</p>
                      <div className="mt-4 space-y-2">
                        {profileStats.map((item) => (
                          <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm">
                            <span className="text-white/72">{item.label}</span>
                            <span className={`font-semibold ${item.tone}`}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            setActiveTopTab("profile");
                            setActiveView("lobby");
                          }}
                          className="flex-1 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
                        >
                          Open Profile
                        </button>
                        <button
                          type="button"
                          onClick={logout}
                          className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/75 transition hover:border-white/25 hover:text-white"
                        >
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <a
                href="https://discord.gg/donutdrops"
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl bg-indigo-500/15 px-5 py-4 font-medium text-indigo-100 transition hover:bg-indigo-500/25"
              >
                Discord
              </a>
              <button
                type="button"
                onClick={logout}
                className="rounded-2xl border border-white/10 px-5 py-4 text-white/75 transition hover:border-white/25 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </motion.header>

        {renderMainPanel()}

        {(activeView === "mines" || activeView === "dice") && (
          <>
            <section className="glass-panel rounded-[2rem] p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-white/45">Recent Games</p>
                {seedMessage && <p className="text-sm text-white/55">{seedMessage}</p>}
              </div>
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {recentGames.length === 0 ? (
                  <p className="text-sm text-white/55">No rounds yet. Spin up a game to populate history.</p>
                ) : (
                  recentGames.map((game) => (
                    <div key={game._id} className="rounded-2xl bg-white/5 p-4 text-sm text-white/75">
                      <div className="flex items-center justify-between capitalize">
                        <span>{game.gameType}</span>
                        <span className={game.profit >= 0 ? "text-emerald-300" : "text-rose-300"}>
                          {game.profit >= 0 ? "+" : ""}${game.profit.toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-2 text-white/45">
                        Bet ${game.betAmount.toFixed(2)} | {game.status.replace("_", " ")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <aside className="glass-panel hidden w-[240px] shrink-0 rounded-[2rem] p-4 xl:ml-6 xl:block">
        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
          <p className="font-semibold text-white">Chat</p>
          <p className="text-sm text-white/55">
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
            {onlineCount || 0} online
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-sky-400/15 bg-sky-500/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-sky-100/65">Rain Controls</p>
              <p className="mt-2 text-sm text-white/72">
                {rain.active
                  ? `Live pool ${formatCompactNumber(rain.amount || 0)} with ${rain.participants} joined`
                  : "Kick off a live rain event for everyone online."}
              </p>
            </div>
            {rain.canStart ? (
              <button
                type="button"
                onClick={handleStartRain}
                disabled={startingRain || rain.active}
                className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:opacity-50"
              >
                {startingRain ? "Starting..." : "Start Rain"}
              </button>
            ) : (
              <div className="rounded-2xl bg-white/5 px-3 py-2 text-[11px] uppercase tracking-[0.24em] text-white/45">
                Player View
              </div>
            )}
          </div>
          {rainMessage && <p className="mt-3 text-xs text-sky-100/75">{rainMessage}</p>}
          {rain.active && (
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-sky-100/70">
                  Rain Live
                </p>
                <span className="rounded-full border border-sky-300/25 bg-slate-950/35 px-3 py-1 text-[11px] font-bold text-sky-100/80">
                  {rainTimerLabel}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-white">
                Live pool {formatCompactNumber(rain.amount || 0)}
              </p>
              <p className="mt-1 text-xs text-white/70">{rain.participants} joined</p>
              <button
                type="button"
                onClick={handleJoinRain}
                disabled={joiningRain}
                className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              >
                {joiningRain ? "Joining..." : "Join Rain"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 rounded-2xl bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">Tip a player</p>
          <div className="mt-3 space-y-2">
            <input
              value={tipForm.username}
              onChange={(event) => setTipForm((current) => ({ ...current, username: event.target.value }))}
              className={`w-full rounded-2xl border bg-black/30 px-4 py-3 text-sm text-white outline-none ${
                !tipForm.username
                  ? "border-white/10"
                  : tipTargetExists
                    ? "border-[#00ff88]"
                    : "border-[#ff3b3b]"
              }`}
              placeholder="Enter username"
            />
            <input
              value={tipForm.amount}
              onChange={(event) => setTipForm((current) => ({ ...current, amount: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
              placeholder="Amount"
            />
            <button
              type="button"
              onClick={handleTip}
              disabled={tipping || !tipTargetExists}
              className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              {tipping ? "Sending..." : "Send Tip"}
            </button>
            {tipMessage && <p className="text-xs text-white/60">{tipMessage}</p>}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <a
            href="https://discord.gg/donutdrops"
            target="_blank"
            rel="noreferrer"
            className="block rounded-2xl border border-indigo-400/40 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200 transition hover:scale-[1.01] hover:border-indigo-300/60 hover:bg-indigo-500/15"
          >
            Join our Discord!
          </a>
          {rain.active && (
            <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-sky-100/70">
                  Rain Live
                </p>
                <span className="rounded-full border border-sky-300/25 bg-slate-950/35 px-3 py-1 text-[11px] font-bold text-sky-100/80">
                  {rainTimerLabel}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-white">
                Live pool {formatCompactNumber(rain.amount || 0)}
              </p>
              <p className="mt-1 text-xs text-white/70">In chat: {rain.participants} joined</p>
              <button
                type="button"
                onClick={handleJoinRain}
                disabled={joiningRain}
                className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-950 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
              >
                {joiningRain ? "Joining..." : "Join Rain"}
              </button>
            </div>
          )}
          {chatMessages.map((message) => (
            <div key={`${message.id}-${message.createdAt}`} className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-sky-300">{message.username}</p>
              <p className="mt-2 text-sm leading-6 text-white/80">{message.text}</p>
            </div>
          ))}
        </div>

        {showAdminPanel && (
          <div className="mt-4 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-fuchsia-100/65">Mod Panel</p>
            <div className="mt-3 space-y-2">
              <input
                value={modForm.username}
                onChange={(event) => setModForm((current) => ({ ...current, username: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                placeholder="Username"
              />
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleModerationAction("mute", 300)}
                  disabled={Boolean(moderatingAction)}
                  className="rounded-2xl bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-60"
                >
                  Mute
                </button>
                <button
                  type="button"
                  onClick={() => handleModerationAction("kick")}
                  disabled={Boolean(moderatingAction)}
                  className="rounded-2xl bg-rose-400 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-60"
                >
                  Kick
                </button>
                <button
                  type="button"
                  onClick={() => handleModerationAction("ban")}
                  disabled={Boolean(moderatingAction)}
                  className="rounded-2xl bg-red-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  Ban
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleModerationAction("shadowmute")}
                  disabled={Boolean(moderatingAction)}
                  className="rounded-2xl bg-slate-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  Shadow
                </button>
                <button
                  type="button"
                  onClick={() => handleModerationAction("unmute")}
                  disabled={Boolean(moderatingAction)}
                  className="rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-60"
                >
                  Unmute
                </button>
              </div>
              <input
                value={modForm.word}
                onChange={(event) => setModForm((current) => ({ ...current, word: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                placeholder="Custom banned word"
              />
              <button
                type="button"
                onClick={handleAddCustomWord}
                disabled={Boolean(moderatingAction)}
                className="w-full rounded-2xl bg-fuchsia-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                Add Banned Word
              </button>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Grant Balance</p>
                <input
                  value={adminBalanceAmount}
                  onChange={(event) => setAdminBalanceAmount(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                  placeholder="1m"
                />
                <button
                  type="button"
                  onClick={handleAdminGiveBalance}
                  disabled={Boolean(moderatingAction)}
                  className="mt-2 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
                >
                  Give Balance
                </button>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Rain Amount</p>
                <input
                  value={adminRainAmount}
                  onChange={(event) => setAdminRainAmount(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                  placeholder="1m"
                />
                <button
                  type="button"
                  onClick={handleStartRain}
                  disabled={startingRain || rain.active}
                  className="mt-2 w-full rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
                >
                  {startingRain ? "Starting..." : "Start Rain"}
                </button>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.22em] text-white/45">Bonus Codes</p>
                <input
                  value={adminPromoForm.code}
                  onChange={(event) =>
                    setAdminPromoForm((current) => ({ ...current, code: event.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                  placeholder="Promo code"
                />
                <input
                  value={adminPromoForm.reward}
                  onChange={(event) =>
                    setAdminPromoForm((current) => ({ ...current, reward: event.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
                  placeholder="1b"
                />
                <button
                  type="button"
                  onClick={handleCreatePromoCode}
                  disabled={Boolean(moderatingAction)}
                  className="mt-2 w-full rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
                >
                  Add Promo Code
                </button>
                {adminPromoCodes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {adminPromoCodes.map((promo) => (
                      <div
                        key={promo.id}
                        className="flex items-center justify-between rounded-2xl bg-white/5 px-3 py-2 text-xs text-white/80"
                      >
                        <div>
                          <p className="font-semibold text-white">{promo.code}</p>
                          <p className="text-white/45">{formatMoney(promo.reward)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeletePromoCode(promo.id)}
                          disabled={Boolean(moderatingAction)}
                          className="rounded-xl bg-rose-500/80 px-3 py-2 font-semibold text-white disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {customWords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {customWords.map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => handleRemoveCustomWord(word)}
                      disabled={Boolean(moderatingAction)}
                      className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/75 disabled:opacity-60"
                    >
                      {word} ×
                    </button>
                  ))}
                </div>
              )}
              {flaggedMessages.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/45">Flags</p>
                  <div className="mt-2 space-y-2">
                    {flaggedMessages.slice(0, 4).map((flag) => (
                      <div key={flag.id} className="rounded-2xl bg-white/5 p-3 text-xs text-white/75">
                        <p className="font-semibold text-rose-200">{flag.username}</p>
                        <p className="mt-1 text-white/55">{flag.reason}</p>
                        <p className="mt-1 line-clamp-2">{flag.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {modMessage && <p className="mt-3 text-xs text-fuchsia-100/75">{modMessage}</p>}
          </div>
        )}

        {chatError && <p className="mt-4 text-sm text-rose-300">{chatError}</p>}
        {activeTimeoutSeconds > 0 && (
          <p className="mt-2 text-sm text-amber-200">Timed out for spam. Chat unlocks in {timeoutLabel}.</p>
        )}

        <div className="mt-4 flex gap-2">
          <input
            value={chatInput}
            onChange={(event) => setChatInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && activeTimeoutSeconds === 0) {
                event.preventDefault();
                handleSendChat();
              }
            }}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
            placeholder="Type a message..."
            disabled={activeTimeoutSeconds > 0}
          />
          <button
            type="button"
            onClick={handleSendChat}
            disabled={activeTimeoutSeconds > 0}
            className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Send
          </button>
        </div>
      </aside>

    </div>
  );
}
