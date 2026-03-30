import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { MinesGame } from "./MinesGame.jsx";
import { DiceGame } from "./DiceGame.jsx";
import { BlackjackGame } from "./BlackjackGame.jsx";
import { ChickenGame } from "./ChickenGame.jsx";
import { RouletteGame } from "./RouletteGame.jsx";
import { LimboGame } from "./LimboGame.jsx";
import { PlinkoGame } from "./PlinkoGame.jsx";
import { ArcadeGame } from "./ArcadeGame.jsx";
import { FairnessCard } from "./FairnessCard.jsx";
import { GameCard } from "./GameCard.jsx";
import { WalletDisplay } from "./WalletDisplay.jsx";
import { api } from "../lib/api.js";
import { parseBetInput } from "../lib/betting.js";

const topNavItems = ["Fairness", "Affiliate", "Bonus", "Leaderboard", "Profile", "Store"];

const gameCards = [
  { id: "blackjack", label: "Blackjack", accent: "from-orange-700 via-orange-500 to-amber-300", players: 6, image: "/images/blackjack-card.svg" },
  { id: "mines", label: "Mines", accent: "from-emerald-900 via-emerald-500 to-lime-300", players: 8, image: "/images/mines-card.svg" },
  { id: "roulette", label: "Roulette", accent: "from-fuchsia-900 via-pink-500 to-amber-300", players: 7, image: "/images/roulette-card.svg" },
  { id: "limbo", label: "Limbo", accent: "from-amber-800 via-orange-500 to-yellow-300", players: 6, image: "/images/limbo-card.svg" },
  { id: "plinko", label: "Plinko", accent: "from-cyan-900 via-cyan-500 to-sky-300", players: 3, image: "/images/plinko-card.svg" }
];

const sideGames = ["Cases", "Case Battles", "Blackjack", "Mines", "Plinko", "Limbo", "Dice", "Roulette", "Chicken"];
const FALLBACK_CRYPTO_ASSETS = [
  { symbol: "BTC", label: "Bitcoin", address: "bc1qlxer836vvxah73m5sl9dev78tuvfn9xkg4qqky", minUsdAmount: 5, donutsPerOrder: 71_428_571 },
  { symbol: "ETH", label: "Ethereum", address: "0xF8914Bb5a5fe8e3df8256877c4ed1E7F6d0BE190", minUsdAmount: 5, donutsPerOrder: 71_428_571 },
  { symbol: "SOL", label: "Solana", address: "ExWCCU5SJbYePDX59itfm69hDAiFg9EgLUCG34Z187cg", minUsdAmount: 5, donutsPerOrder: 71_428_571 }
];

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function buildProfitPath(recentGames, startingBalance) {
  const points = [startingBalance - recentGames.reduce((sum, game) => sum + game.profit, 0)];

  recentGames.forEach((game) => {
    points.push(points[points.length - 1] + game.profit);
  });

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(max - min, 1);

  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const y = 100 - ((point - min) / range) * 100;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");
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
  const [players, setPlayers] = useState([]);
  const [tipForm, setTipForm] = useState({ username: "", amount: "100" });
  const [tipMessage, setTipMessage] = useState("");
  const [tipping, setTipping] = useState(false);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
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
  const availableCryptoAssets = cryptoAssets.length ? cryptoAssets : FALLBACK_CRYPTO_ASSETS;
  const selectedCryptoAsset =
    availableCryptoAssets.find((asset) => asset.symbol === selectedCrypto) || availableCryptoAssets[0];

  useEffect(() => {
    setClientSeed(user?.clientSeed || "");
  }, [user?.clientSeed]);

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

  async function updateBalance(balance) {
    setUser((currentUser) => ({ ...currentUser, balance }));

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

  async function handleSendChat() {
    if (!chatInput.trim()) {
      return;
    }

    try {
      const data = await api.sendChat(token, { text: chatInput });
      setChatMessages(data.messages || []);
      setChatTimeoutUntil(data.timeoutUntil || 0);
      setChatInput("");
      setChatError("");
    } catch (error) {
      setChatError(error.message);
      const freshChat = await api.getChat(token).catch(() => null);
      if (freshChat) {
        setChatMessages(freshChat.messages || []);
        setChatTimeoutUntil(freshChat.timeoutUntil || 0);
      }
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

  const totalProfit = recentGames.reduce((sum, game) => sum + game.profit, 0);
  const totalWagered = recentGames.reduce((sum, game) => sum + game.betAmount, 0);
  const gamesPlayed = recentGames.length;
  const winCount = recentGames.filter((game) => game.profit > 0).length;
  const biggestWin = recentGames.reduce((max, game) => Math.max(max, game.profit), 0);
  const winRate = gamesPlayed ? ((winCount / gamesPlayed) * 100).toFixed(1) : "0.0";
  const trackerPath = buildProfitPath(recentGames, user.balance || 1000);
  const activeTimeoutSeconds = Math.max(0, Math.ceil((chatTimeoutUntil - Date.now()) / 1000));
  const timeoutLabel = useMemo(() => {
    const minutes = Math.floor(activeTimeoutSeconds / 60);
    const seconds = activeTimeoutSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }, [activeTimeoutSeconds]);

  function openWallet() {
    setWalletOpen(true);
    setWalletStep("wallet");
    setWalletTab("deposit");
    setWalletMessage("");
    setCryptoTxHash("");
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

  async function ensureCryptoOrder(symbol = selectedCrypto) {
    setWalletLoading(true);
    setWalletMessage("");

    try {
      const data = await api.createCryptoOrder(token, { asset: symbol });
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
    await ensureCryptoOrder(symbol);
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
                      className="bg-transparent px-4 py-3 text-sm text-white outline-none"
                      placeholder="Promo code"
                    />
                    <button type="button" className="bg-white/10 px-4 py-3 text-sm font-semibold text-white">
                      Claim
                    </button>
                  </div>
                </div>

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

                      <div className="mt-5 rounded-[1.6rem] border border-emerald-400/15 bg-emerald-500/5 px-5 py-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm uppercase tracking-[0.2em] text-white/45">Selected Asset</p>
                            <p className="mt-2 text-2xl font-bold text-white">
                              {selectedCryptoAsset?.label || selectedCrypto}
                            </p>
                          </div>
                          <div className="rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300">
                            Deposits Enabled
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl bg-black/20 px-4 py-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Minimum Spend</p>
                            <p className="mt-2 text-xl font-bold text-white">
                              ${selectedCryptoAsset?.minUsdAmount?.toFixed?.(2) || "5.00"}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-black/20 px-4 py-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Donut Credit</p>
                            <p className="mt-2 text-xl font-bold text-white">
                              {Number(cryptoOrder?.donutCredit || selectedCryptoAsset?.donutsPerOrder || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-black/20 px-4 py-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Order Status</p>
                            <p className="mt-2 text-xl font-bold text-white capitalize">
                              {cryptoOrder?.status || "Not created"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-black/20 px-4 py-4">
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

                        <div className="mt-4 rounded-2xl bg-black/20 px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Exact Amount Due</p>
                              <p className="mt-2 text-2xl font-bold text-white">
                                {cryptoOrder?.expectedAmount || "--"} {selectedCrypto}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                copyText(
                                  String(cryptoOrder?.expectedAmount || ""),
                                  "Exact crypto amount copied."
                                )
                              }
                              disabled={!cryptoOrder?.expectedAmount}
                              className="rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                            >
                              Copy Amount
                            </button>
                          </div>
                          <p className="mt-3 text-sm text-white/55">
                            A backend deposit order locks the exact ${selectedCryptoAsset?.minUsdAmount || 5} checkout size.
                            The site will only credit after the transaction is confirmed for this order.
                          </p>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => ensureCryptoOrder(selectedCrypto)}
                            className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950"
                          >
                            {cryptoOrder ? "Refresh Order" : "Create Order"}
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

                        <div className="mt-4 rounded-2xl bg-black/20 px-4 py-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/45">Submit Transaction Hash</p>
                          <input
                            value={cryptoTxHash}
                            onChange={(event) => setCryptoTxHash(event.target.value)}
                            className="mt-3 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none"
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

                        <p className="mt-4 text-sm text-white/55">
                          Fake browser claims do not credit balance. The server only releases funds after a wallet verifier
                          confirms the matching on-chain transaction for this order.
                        </p>

                        {walletMessage && (
                          <div className="mt-4 rounded-2xl bg-white/5 px-4 py-4 text-sm text-white/70">
                            {walletMessage}
                          </div>
                        )}
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
                      Pay exactly {depositSession?.requiredAmount || 950} in Minecraft money to the DonutSMP deposit bot. Once your bot confirms that payment for the linked username, the website will credit your balance.
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

          <div className="grid gap-4 xl:grid-cols-4">
            {[
              { label: "30 Minute Bonus", amount: totalWagered >= 100 ? 5 : 0, meta: "Faucet reward after meeting the wager requirement." },
              { label: "Daily Bonus", amount: totalWagered * 0.03, meta: "Based on your past 24h wagering." },
              { label: "Weekly Bonus", amount: totalWagered * 0.08, meta: "Based on your past 7d wagering." },
              { label: "Monthly Bonus", amount: totalWagered * 0.15, meta: "Based on your past 30d wagering." }
            ].map((bonus) => (
              <div key={bonus.label} className="rounded-[1.8rem] border border-white/6 bg-[#171824] p-6">
                <p className="text-sm uppercase tracking-[0.04em] text-indigo-200/70">{bonus.label}</p>
                <p className="mt-4 text-4xl font-black text-white">{formatMoney(bonus.amount)}</p>
                <p className="mt-4 min-h-[52px] text-sm leading-6 text-white/60">{bonus.meta}</p>
                <div className="mt-4 rounded-xl bg-black/20 px-4 py-3 text-sm text-white/55">
                  Available in 0m 0s
                </div>
                <button
                  type="button"
                  className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950"
                >
                  On Cooldown
                </button>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.6fr,1fr]">
            <div className="rounded-[1.8rem] border border-white/6 bg-[#171824] p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-200/70">Rakeback</p>
              <div className="mt-4 rounded-xl bg-black/20 px-4 py-3 text-sm text-white/65">
                Rakeback rate: claimable right now from calculated losses
              </div>
              <div className="mt-5 rounded-[1.4rem] border border-white/6 bg-[#11121a] p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-white/45">Available Rakeback</p>
                <p className="mt-3 text-4xl font-black text-white">
                  {formatMoney(Math.max(totalWagered * 0.02 - Math.max(totalProfit, 0), 0))}
                </p>
                <p className="mt-3 text-sm text-white/55">
                  Claimable once per hour based on your wagered volume.
                </p>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/6 bg-[#171824] p-6">
              <p className="text-sm uppercase tracking-[0.25em] text-white/45">Status</p>
              <p className="mt-4 text-white/80">Available in 0m 0s</p>
              <button
                type="button"
                className="mt-5 w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950"
              >
                Claim Rakeback
              </button>
            </div>
          </div>
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
              <input
                value={clientSeed}
                onChange={(event) => setClientSeed(event.target.value)}
                className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-accent"
                placeholder="Enter client seed"
              />
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
      const referralCode = user.username.toUpperCase();
      const referralLink = `https://donut-drops.com/?ref=${referralCode}`;

      return (
        <section className="space-y-5">
          <div className="rounded-[1.8rem] border border-white/6 bg-[#171824] p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-indigo-200/70">Affiliate</p>
            <div className="mt-5 grid gap-4 xl:grid-cols-4">
              {[
                { label: "Commission", value: "5%" },
                { label: "Users Referred", value: "0" },
                { label: "Total Earned", value: formatMoney(Math.max(totalProfit, 0) * 0.05) },
                { label: "Total Claimed", value: "$0" }
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
                <div className="mt-3 rounded-xl bg-black/20 px-5 py-4 text-white">{referralCode}</div>
              </label>

              <label className="mt-5 block">
                <span className="text-sm font-semibold text-white">Referral Link</span>
                <div className="mt-3 rounded-xl bg-black/20 px-5 py-4 text-white">{referralLink}</div>
              </label>

              <div className="mt-5 rounded-xl bg-black/20 px-5 py-4 text-white/65">
                You earn 5% of your referrals&apos; wager volume. The more they play, the more you earn.
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/6 bg-[#171824] p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-indigo-200/70">Claim</p>
              <div className="mt-5 rounded-[1.3rem] bg-[#11121a] p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">Ready To Claim</p>
                <p className="mt-3 text-4xl font-black text-white">$0.00</p>
              </div>
              <button
                type="button"
                className="mt-5 w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950"
              >
                Claim Earnings
              </button>
              <p className="mt-4 text-sm leading-6 text-white/55">
                Claims typically settle instantly, though rare delays may extend this process up to one
                hour. Minimum amount to claim is $10M.
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
                    Level 1
                  </span>
                  <span className="rounded-full bg-white/5 px-3 py-1 text-white/65">
                    ${totalWagered.toFixed(2)} wagered
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between text-sm text-white/60">
                <span>Progress to Level 2</span>
                <span>${Math.max(500 - totalWagered, 0).toFixed(2)} remaining</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min((totalWagered / 500) * 100, 100)}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-white/55">
                <span>${totalWagered.toFixed(2)} / $500 this level</span>
                <span>{Math.min((totalWagered / 500) * 100, 100).toFixed(0)}% complete</span>
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
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-yellow-300 to-amber-400 px-4 py-4 text-lg font-bold text-slate-950"
              >
                Purchase
              </button>
              <button
                type="button"
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
                  Promo codes can be wired into bonuses next so the store and bonus center connect.
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
    <div className="relative grid min-h-[88vh] gap-5 xl:grid-cols-[220px,1fr,300px]">
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
                <linearGradient id="trackerFillMini" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(34,197,94,0.25)" />
                  <stop offset="100%" stopColor="rgba(239,68,68,0.08)" />
                </linearGradient>
              </defs>
              <path d={`${trackerPath} L 100 100 L 0 100 Z`} fill="url(#trackerFillMini)" opacity="0.65" />
              <path
                d={trackerPath}
                fill="none"
                stroke={totalProfit >= 0 ? "#4ade80" : "#fb7185"}
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
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

      <aside className="glass-panel hidden rounded-[2rem] py-6 xl:block">
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

      <main className="space-y-5">
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
              <button
                type="button"
                className="rounded-2xl bg-white/5 px-5 py-4 font-medium text-white"
              >
                {user.username}
              </button>
              <a
                href="https://discord.gg/nr3edCRG"
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

      <aside className="glass-panel hidden rounded-[2rem] p-4 xl:block">
        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
          <p className="font-semibold text-white">Chat</p>
          <p className="text-sm text-white/55">
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
            42 online
          </p>
        </div>

        <div className="mt-4 rounded-2xl bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">Tip a player</p>
          <div className="mt-3 space-y-2">
            <select
              value={tipForm.username}
              onChange={(event) => setTipForm((current) => ({ ...current, username: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
            >
              {players.length === 0 ? (
                <option value="">No players available</option>
              ) : (
                players.map((player) => (
                  <option key={player.id} value={player.username}>
                    {player.username}
                  </option>
                ))
              )}
            </select>
            <input
              value={tipForm.amount}
              onChange={(event) => setTipForm((current) => ({ ...current, amount: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
              placeholder="100k"
            />
            <button
              type="button"
              onClick={handleTip}
              disabled={tipping}
              className="w-full rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              {tipping ? "Sending..." : "Send Tip"}
            </button>
            {tipMessage && <p className="text-xs text-white/60">{tipMessage}</p>}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-indigo-400/40 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">
            Join our Discord!
          </div>
          {chatMessages.map((message) => (
            <div key={`${message.id}-${message.createdAt}`} className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-sky-300">{message.username}</p>
              <p className="mt-2 text-sm leading-6 text-white/80">{message.text}</p>
            </div>
          ))}
        </div>

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
