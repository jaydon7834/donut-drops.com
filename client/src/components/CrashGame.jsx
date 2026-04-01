import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { createAppSocket } from "../lib/socket.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";
import { triggerGameEffect } from "../lib/gameEffects.js";

function formatMoney(value) {
  const amount = Number(value || 0);

  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(amount >= 10_000_000_000 ? 0 : 1).replace(/\.0$/, "")}b`;
  }

  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}m`;
  }

  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(amount >= 10_000 ? 0 : 1).replace(/\.0$/, "")}k`;
  }

  return `$${amount.toFixed(2)}`;
}

function formatCrashValue(value) {
  const amount = Number(value || 0);

  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(amount >= 10_000_000_000 ? 0 : 1).replace(/\.0$/, "")}b`;
  }

  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}m`;
  }

  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(amount >= 10_000 ? 0 : 1).replace(/\.0$/, "")}k`;
  }

  return amount.toFixed(amount >= 100 ? 0 : 2);
}

function getRocketPlacement(multiplier, status) {
  if (status === "countdown") {
    return { left: "50%", top: "58%" };
  }

  if (status === "crashed") {
    return { left: "50%", top: "18%" };
  }

  const normalized = Math.log(Math.max(Number(multiplier || 1), 1)) / Math.log(40);
  const progress = Math.max(0, Math.min(1, normalized));
  const top = 82 - progress * 62;

  return {
    left: "50%",
    top: `${top}%`
  };
}

function getCountdownText(bettingClosesAt) {
  const remaining = Math.max(0, Math.ceil((Number(bettingClosesAt || 0) - Date.now()) / 1000));

  if (remaining <= 0) {
    return "START";
  }

  return `T-${remaining}`;
}

function getSkyStage(multiplier, status) {
  if (status === "crashed") {
    return {
      label: "Signal Lost",
      subtitle: "The rocket broke apart before escape velocity.",
      background:
        "radial-gradient(circle at top, rgba(251,113,133,0.18), rgba(8,12,20,0.98) 48%)"
    };
  }

  if (status === "countdown") {
    return {
      label: "Earth",
      subtitle: "Engines primed on the launch pad.",
      background:
        "linear-gradient(180deg, rgba(59,130,246,0.25) 0%, rgba(14,116,144,0.18) 24%, rgba(8,15,26,0.95) 72%)"
    };
  }

  if (multiplier >= 40) {
    return {
      label: "Sunline",
      subtitle: "The rocket is blazing past the sun.",
      background:
        "radial-gradient(circle at 60% 20%, rgba(250,204,21,0.26), rgba(249,115,22,0.12) 22%, rgba(8,12,20,0.98) 55%)"
    };
  }

  if (multiplier >= 30) {
    return {
      label: "Saturn",
      subtitle: "Ringed orbit ahead.",
      background:
        "radial-gradient(circle at 72% 28%, rgba(245,158,11,0.18), rgba(8,12,20,0.98) 48%)"
    };
  }

  if (multiplier >= 20) {
    return {
      label: "Jupiter",
      subtitle: "Heavy atmosphere and giant storms.",
      background:
        "radial-gradient(circle at 75% 24%, rgba(251,191,36,0.16), rgba(8,12,20,0.98) 45%)"
    };
  }

  if (multiplier >= 10) {
    return {
      label: "Moon Run",
      subtitle: "Breaking into deep space.",
      background:
        "radial-gradient(circle at 72% 18%, rgba(255,255,255,0.16), rgba(8,12,20,0.98) 42%)"
    };
  }

  return {
    label: "Atmosphere",
    subtitle: "Climbing through the clouds.",
    background:
      "linear-gradient(180deg, rgba(56,189,248,0.22) 0%, rgba(37,99,235,0.14) 35%, rgba(8,15,26,0.98) 78%)"
  };
}

function getStatusTone(status) {
  if (status === "crashed") {
    return "rose";
  }

  if (status === "running") {
    return "emerald";
  }

  return "sky";
}

function createBetSlip() {
  return {
    amount: "1k",
    autoCashout: ""
  };
}

export function CrashGame({ token, user, onBalanceChange }) {
  const [round, setRound] = useState(null);
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState("");
  const [displayMultiplier, setDisplayMultiplier] = useState(1);
  const [impactFlash, setImpactFlash] = useState(false);
  const [betSlip, setBetSlip] = useState(createBetSlip());
  const previousStatusRef = useRef("");
  const animationFrameRef = useRef(0);
  const displayMultiplierRef = useRef(1);

  useEffect(() => {
    let cancelled = false;

    async function loadState() {
      try {
        const data = await api.getCrashState(token);
        if (!cancelled) {
          setRound(data.round);
          setHistory(data.history || []);
          const initialMultiplier = Number(data.round?.multiplier || 1);
          displayMultiplierRef.current = initialMultiplier;
          setDisplayMultiplier(initialMultiplier);
        }
      } catch (error) {
        if (!cancelled) {
          setFeedback(error.message);
        }
      }
    }

    loadState();

    const socket = createAppSocket(user);

    socket.on("crash:state", (payload) => {
      if (cancelled) {
        return;
      }

      setRound(payload);

      const myEntries = payload?.activeBets || [];
      const activeEntries = myEntries.filter((entry) => entry.status === "active");
      const cashedEntries = myEntries.filter((entry) => entry.status === "cashed");

      if (payload?.status === "crashed" && activeEntries.length > 0) {
        triggerGameEffect("loss");
      }

      if (payload?.status === "crashed" && cashedEntries.length > 0) {
        const biggestPayout = Math.max(...cashedEntries.map((entry) => Number(entry.payout || 0)), 0);
        triggerGameEffect(biggestPayout >= 3 * Math.max(...cashedEntries.map((entry) => Number(entry.bet || 0)), 1) ? "big-win" : "win");
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrameRef.current);
      socket.disconnect();
    };
  }, [token, user]);

  useEffect(() => {
    const nextValue = Number(round?.status === "crashed" ? round?.crashPoint || 1 : round?.multiplier || 1);

    cancelAnimationFrame(animationFrameRef.current);

    const startValue = displayMultiplierRef.current;
    const startedAt = performance.now();
    const duration = round?.status === "running" ? 170 : 360;

    function tick(now) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      const value = startValue + (nextValue - startValue) * eased;

      displayMultiplierRef.current = value;
      setDisplayMultiplier(value);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    }

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [round?.multiplier, round?.crashPoint, round?.status]);

  useEffect(() => {
    if (previousStatusRef.current !== "crashed" && round?.status === "crashed") {
      setImpactFlash(true);
      window.setTimeout(() => setImpactFlash(false), 360);
    }

    previousStatusRef.current = round?.status || "";
  }, [round?.status]);

  const currentMultiplier = `${displayMultiplier.toFixed(2)}x`;
  const activeBets = round?.activeBets || [];
  const queuedBets = round?.queuedBets || [];
  const liveEntries = activeBets.filter((entry) => entry.status === "active");
  const cashedEntries = activeBets.filter((entry) => entry.status === "cashed");
  const manualCashoutEntry = liveEntries[0] || null;
  const canManualCashout = round?.status === "running" && Boolean(manualCashoutEntry);
  const autoCashoutEnabled = String(betSlip.autoCashout || "").trim().length > 0;
  const players = round?.players || [];
  const recentCrashHistory = history.slice(0, 5);
  const statusTone = getStatusTone(round?.status);
  const countdownText = getCountdownText(round?.bettingClosesAt);
  const totalPlayerExposure = activeBets.reduce((sum, entry) => sum + Number(entry.bet || 0), 0);
  const totalQueuedExposure = queuedBets.reduce((sum, entry) => sum + Number(entry.bet || 0), 0);
  const projectedCashout = liveEntries.reduce((sum, entry) => sum + Number(entry.bet || 0) * Number(round?.multiplier || 1), 0);
  const topPlayers = [...players]
    .sort((left, right) => Number(right.bet || 0) - Number(left.bet || 0))
    .slice(0, 20);
  const rocketPlacement = getRocketPlacement(round?.multiplier, round?.status);
  const skyStage = getSkyStage(Number(round?.multiplier || 1), round?.status);
  const particleDots = useMemo(
    () =>
      Array.from({ length: 36 }, (_, index) => ({
        id: index,
        left: `${(index * 19) % 100}%`,
        top: `${(index * 29) % 100}%`,
        size: 2 + (index % 3),
        duration: 10 + (index % 7) * 1.8,
        delay: (index % 5) * 0.6
      })),
    []
  );

  function updateBetSlip(key, value) {
    setBetSlip((current) => ({ ...current, [key]: value }));
  }

  async function handlePlaceBet() {
    setLoading("join");
    setFeedback("");

    try {
      const data = await api.placeCrashBet(token, {
        bet: parseBetInput(betSlip.amount),
        autoCashout: autoCashoutEnabled ? Number(betSlip.autoCashout) : null
      });

      setRound(data.round);
      onBalanceChange(data.balance);
      setFeedback(`Queued your crash bet for the ${round?.status === "countdown" ? "current" : "next"} round.`);
      setBetSlip(createBetSlip());
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading("");
    }
  }

  async function handleCashout(entryId) {
    setLoading(entryId);
    setFeedback("");

    try {
      const data = await api.cashoutCrash(token, { entryId });
      setRound(data.round);
      onBalanceChange(data.balance);
      triggerGameEffect(data.payout >= 3 * Number(activeBets.find((entry) => entry.entryId === entryId)?.bet || 1) ? "big-win" : "win");
      setFeedback(`Cashed out at ${data.multiplier.toFixed(2)}x for ${formatMoney(data.payout)}.`);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading("");
    }
  }

  const controls = (
    <div className="space-y-4 text-white">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/65">Crash Bet</p>
        <h2 className="mt-3 text-3xl font-black text-white">Time the escape</h2>
        <p className="mt-3 text-sm leading-6 text-white/60">
          The game keeps rolling. Join at any time, queue your slips for the next round, then cash them manually or by auto target.
        </p>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
          <p>Minimum bet: <span className="font-bold text-white">1k</span></p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#171b2a] p-3">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/45">Bet</p>

        <div className="mt-3 space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Amount</p>
            <div className="mt-2 flex overflow-hidden rounded-xl border border-white/10 bg-[#1e293b]">
              <input
                value={betSlip.amount}
                onChange={(event) => updateBetSlip("amount", event.target.value)}
                className="w-full bg-transparent p-3 text-white outline-none"
                placeholder="1k"
              />
              <div className="flex items-center gap-1 pr-2">
                <button type="button" onClick={() => updateBetSlip("amount", formatBetInput(Math.max(1, Math.round(parseBetInput(betSlip.amount || 0) * 0.5))))} className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-white">
                  1/2
                </button>
                <button type="button" onClick={() => updateBetSlip("amount", formatBetInput(Math.max(1, Math.round(parseBetInput(betSlip.amount || 0) * 2))))} className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-white">
                  2x
                </button>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Auto Cashout</p>
            <input
              value={betSlip.autoCashout}
              onChange={(event) => updateBetSlip("autoCashout", event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#1e293b] p-3 text-white outline-none"
              placeholder="Optional"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              if (manualCashoutEntry) {
                handleCashout(manualCashoutEntry.entryId);
              }
            }}
            disabled={!canManualCashout || (loading !== "" && loading !== manualCashoutEntry?.entryId)}
            className={`w-full rounded-xl px-4 py-3 text-sm font-black transition ${
              canManualCashout
                ? "bg-gradient-to-r from-emerald-400 to-lime-300 text-slate-950 hover:scale-[1.01]"
                : "bg-white/10 text-white/45"
            } disabled:cursor-not-allowed disabled:opacity-100`}
          >
            {loading === manualCashoutEntry?.entryId ? "Cashing Out..." : "Cash Out"}
          </button>

          <p className="text-xs text-white/50">
            {canManualCashout
              ? `Ready at ${Number(round?.multiplier || 1).toFixed(2)}x`
              : queuedBets.length > 0
                ? "Your bet is queued. Cash out becomes available when the round starts."
                : round?.status === "crashed"
                  ? "This round already crashed."
                  : autoCashoutEnabled
                    ? "Auto cashout is armed, but you can still cash out manually before it hits."
                    : "Leave auto cashout blank if you want to play manual only."}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-[#171b2a] p-4">
        <div className="flex items-center justify-between">
          <p className="text-white/65">Round</p>
          <span className="font-bold text-white">{round?.roundId || "Loading"}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-white/65">Status</p>
          <span className={`font-bold capitalize ${statusTone === "emerald" ? "text-emerald-300" : statusTone === "rose" ? "text-rose-300" : "text-sky-300"}`}>
            {round?.status || "idle"}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-white/65">Your Exposure</p>
          <span className="font-bold text-white">{formatMoney(totalPlayerExposure + totalQueuedExposure)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-white/65">Room Pot</p>
          <span className="font-bold text-white">{formatMoney(round?.totalBet || 0)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-white/65">Queued Next</p>
          <span className="font-bold text-white">{formatMoney(round?.queueTotal || 0)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handlePlaceBet}
        disabled={loading !== "" || liveEntries.length > 0 || queuedBets.length > 0}
        className="w-full rounded-xl bg-gradient-to-r from-sky-400 to-cyan-300 px-4 py-4 text-lg font-black text-slate-950 transition hover:scale-[1.01] disabled:opacity-50"
      >
        {loading === "join"
          ? "Joining..."
          : liveEntries.length > 0
            ? "Bet Live"
            : queuedBets.length > 0
              ? "Already Queued"
              : round?.status === "countdown"
                ? "Join This Round"
                : "Join Next Round"}
      </button>

      {queuedBets.length > 0 ? (
        <div className="rounded-2xl border border-sky-400/15 bg-sky-400/8 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-100/70">Queued For Next Round</p>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2 text-sm">
              <span className="font-semibold text-white">{formatMoney(queuedBets[0]?.bet)}</span>
              <span className="text-sky-100/80">
                {queuedBets[0]?.autoCashout ? `Auto ${Number(queuedBets[0].autoCashout).toFixed(2)}x` : "Manual"}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {feedback ? <p className="text-sm text-white/70">{feedback}</p> : null}
    </div>
  );

  const main = (
    <div className="space-y-5">
      <motion.div
        animate={round?.status === "crashed" ? { x: [0, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.34 }}
        className={`relative overflow-hidden rounded-[2rem] border p-5 xl:p-6 ${
          round?.status === "crashed"
            ? "border-rose-400/30 bg-[radial-gradient(circle_at_top,rgba(251,113,133,0.18),rgba(8,12,20,0.96)_45%)]"
            : "border-emerald-400/15 bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.16),rgba(8,12,20,0.96)_45%)]"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-90">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:56px_56px]" />
          <div className={`absolute inset-0 transition ${impactFlash ? "bg-rose-500/12" : ""}`} />
          {particleDots.map((dot) => (
            <motion.span
              key={dot.id}
              className="absolute rounded-full bg-emerald-300/40"
              style={{ left: dot.left, top: dot.top, width: dot.size, height: dot.size }}
              animate={{ y: [0, -26, -52], opacity: [0.18, 0.45, 0] }}
              transition={{ duration: dot.duration, delay: dot.delay, repeat: Infinity, ease: "linear" }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-white/45">Live Multiplier</p>
            <motion.h3
              key={`${round?.status}-${Math.floor(displayMultiplier * 100)}`}
              initial={{ scale: 0.97, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`mt-3 text-6xl font-black sm:text-7xl ${round?.status === "crashed" ? "text-rose-300" : "text-emerald-300"}`}
              style={{
                textShadow:
                  round?.status === "crashed"
                    ? "0 0 24px rgba(251,113,133,0.55)"
                    : "0 0 24px rgba(0,255,136,0.45)"
              }}
            >
              {round?.status === "crashed" ? `💥 ${Number(round?.crashPoint || 1).toFixed(2)}x` : currentMultiplier}
            </motion.h3>
            <p className="mt-3 text-sm text-white/60">
              {round?.status === "countdown"
                ? `Launch sequence ${countdownText}`
                : round?.status === "running"
                  ? "The round is live right now. New joins queue automatically."
                  : "Round ended. Watching the real landing point."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Room Pot</p>
              <p className="mt-2 text-2xl font-black text-white">{formatCrashValue(round?.totalBet || 0)}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">Joined</p>
              <p className="mt-2 text-2xl font-black text-white">{round?.playerCount || 0}</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Last Crashes</p>
            <span className="text-xs uppercase tracking-[0.18em] text-white/35">latest 5 only</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {recentCrashHistory.length === 0 ? (
              <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/55">
                Waiting for the first crash.
              </div>
            ) : (
              recentCrashHistory.map((entry) => (
                <div
                  key={entry.roundId}
                  className={`rounded-full border px-4 py-2 text-sm font-black ${
                    Number(entry.crashPoint || 1) >= 2
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                      : "border-rose-400/20 bg-rose-400/10 text-rose-300"
                  }`}
                >
                  {Number(entry.crashPoint || 1).toFixed(2)}x
                </div>
              ))
            )}
          </div>
        </div>

        <div
          className="relative z-10 mt-5 h-[24rem] overflow-hidden rounded-[1.8rem] border border-white/10 xl:h-[30rem]"
          style={{ background: skyStage.background }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />

          {round?.status === "countdown" ? (
            <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
              <div className="rounded-[2rem] border border-cyan-300/30 bg-slate-950/45 px-10 py-6 text-center shadow-[0_0_40px_rgba(56,189,248,0.18)] backdrop-blur">
                <p className="text-xs uppercase tracking-[0.34em] text-cyan-100/65">Launch Sequence</p>
                <p className="mt-3 text-5xl font-black tracking-[0.18em] text-cyan-100 sm:text-6xl">{countdownText}</p>
              </div>
            </div>
          ) : null}

          {round?.status === "countdown" ? (
            <>
              <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(20,83,45,0),rgba(20,83,45,0.55)_40%,rgba(21,28,36,0.95)_100%)]" />
              <div className="absolute bottom-8 left-10 text-6xl opacity-90">🏙️</div>
              <div className="absolute bottom-10 right-14 text-5xl opacity-80">🗼</div>
              <motion.div
                className="absolute left-[18%] top-[24%] text-3xl opacity-80"
                animate={{ x: [0, 32, 64], y: [0, -4, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "linear" }}
              >
                ✈️
              </motion.div>
              <motion.div
                className="absolute right-[20%] top-[30%] text-2xl opacity-70"
                animate={{ x: [0, -28, -56], y: [0, 3, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              >
                🛩️
              </motion.div>
            </>
          ) : null}

          {round?.status === "running" && Number(round?.multiplier || 1) < 10 ? (
            <>
              <motion.div
                className="absolute right-[18%] top-[16%] text-5xl opacity-80"
                animate={{ y: [0, 8, 0], rotate: [0, 2, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              >
                🛰️
              </motion.div>
              <motion.div
                className="absolute left-[22%] top-[24%] text-3xl opacity-75"
                animate={{ y: [0, -6, 0], x: [0, 6, 0] }}
                transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
              >
                👨‍🚀
              </motion.div>
              <motion.div
                className="absolute right-[30%] top-[34%] text-3xl opacity-70"
                animate={{ y: [0, 5, 0], x: [0, -5, 0] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
              >
                🧑‍🚀
              </motion.div>
            </>
          ) : null}

          {round?.status === "running" && Number(round?.multiplier || 1) >= 10 ? (
            <>
              <motion.div
                className="absolute left-[10%] top-[16%] opacity-80"
                animate={{ y: [0, -4, 0], x: [0, 4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <img
                  src="/images/crash-alien-1.png"
                  alt="Alien"
                  className="h-28 w-28 rounded-2xl object-contain drop-shadow-[0_0_18px_rgba(163,230,53,0.25)]"
                />
              </motion.div>
              <motion.div
                className="absolute right-[10%] top-[22%] opacity-75"
                animate={{ y: [0, 5, 0], x: [0, -6, 0] }}
                transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <img
                  src="/images/crash-alien-2.png"
                  alt="Alien"
                  className="h-28 w-28 rounded-2xl object-contain drop-shadow-[0_0_18px_rgba(163,230,53,0.22)]"
                />
              </motion.div>
              <motion.div
                className="absolute left-[24%] bottom-[20%] text-3xl opacity-65"
                animate={{ y: [0, -3, 0], rotate: [0, -6, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              >
                🛸
              </motion.div>
            </>
          ) : null}

          <div className="absolute inset-0">
            {Array.from({ length: 28 }, (_, index) => (
              <motion.span
                key={`star-${index}`}
                className="absolute rounded-full bg-white/70"
                style={{
                  left: `${(index * 13) % 100}%`,
                  top: `${(index * 17) % 100}%`,
                  width: 1 + (index % 2),
                  height: 1 + (index % 2)
                }}
                animate={{ y: [0, 120], opacity: [0.2, 0.85, 0.1] }}
                transition={{
                  duration: 2.6 + (index % 5) * 0.4,
                  repeat: Infinity,
                  ease: "linear",
                  delay: index * 0.08
                }}
              />
            ))}
          </div>

          {Number(round?.multiplier || 1) >= 10 && round?.status !== "crashed" ? (
            <div className="pointer-events-none absolute right-8 top-8 text-6xl opacity-80">
              {Number(round?.multiplier || 1) >= 40
                ? "☀️"
                : Number(round?.multiplier || 1) >= 30
                  ? "🪐"
                  : Number(round?.multiplier || 1) >= 20
                    ? "🟠"
                    : "🌕"}
            </div>
          ) : null}

          <div className="pointer-events-none absolute left-6 top-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{skyStage.label}</p>
            <p className="mt-2 text-sm font-semibold text-white/75">{skyStage.subtitle}</p>
          </div>

          <motion.div
            className="absolute"
            animate={round?.status === "crashed" ? { scale: [1, 1.18, 0.92, 1], rotate: [0, -6, 8, 0] } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              left: rocketPlacement.left,
              top: rocketPlacement.top,
              transform: "translate(-50%, -50%)"
            }}
          >
            {round?.status === "crashed" ? (
              <div className="relative flex h-36 w-36 items-center justify-center">
                {Array.from({ length: 10 }, (_, index) => (
                  <motion.span
                    key={`burst-${index}`}
                    className="absolute rounded-full"
                    style={{
                      width: 10 + (index % 3) * 6,
                      height: 10 + (index % 3) * 6,
                      background: index % 2 === 0 ? "rgba(251,113,133,0.8)" : "rgba(250,204,21,0.75)"
                    }}
                    animate={{
                      x: [0, Math.cos((index / 10) * Math.PI * 2) * 42],
                      y: [0, Math.sin((index / 10) * Math.PI * 2) * 34],
                      opacity: [0.9, 0]
                    }}
                    transition={{ duration: 0.55, repeat: Infinity, repeatDelay: 1.2 }}
                  />
                ))}
                <span className="text-6xl">💥</span>
              </div>
            ) : (
              <div className="relative flex h-40 w-36 items-center justify-center">
                {round?.status === "countdown" ? (
                  <div className="absolute -top-24 left-1/2 -translate-x-1/2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-8 py-4 text-2xl font-black tracking-[0.18em] text-cyan-100 shadow-[0_0_30px_rgba(56,189,248,0.18)] opacity-0">
                    {countdownText}
                  </div>
                ) : null}
                <motion.div
                  className="absolute bottom-2 h-24 w-16 rounded-full bg-[radial-gradient(circle,rgba(250,204,21,0.95),rgba(249,115,22,0.7),transparent_72%)] blur-[1px]"
                  animate={{
                    scaleY: round?.status === "countdown" ? [0.25, 0.4, 0.25] : [0.9, 1.6, 0.95],
                    scaleX: round?.status === "countdown" ? [0.25, 0.32, 0.25] : [0.85, 1.08, 0.9],
                    opacity: round?.status === "countdown" ? [0.25, 0.45, 0.25] : [0.7, 1, 0.72]
                  }}
                  transition={{ duration: 0.24, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="absolute bottom-0 h-24 w-20 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9),rgba(56,189,248,0.35),transparent_72%)]"
                  animate={{ opacity: round?.status === "countdown" ? [0.08, 0.18, 0.08] : [0.25, 0.45, 0.28] }}
                  transition={{ duration: 0.4, repeat: Infinity }}
                />
                <motion.div
                  className="relative drop-shadow-[0_0_18px_rgba(56,189,248,0.45)]"
                  animate={round?.status === "countdown" ? { y: [0, 0, 0], rotate: [0, 0, 0] } : { y: [0, -2, 0], rotate: [-1, 1, -1] }}
                  transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <img
                    src="/images/crash-rocket.png"
                    alt="Rocket"
                    className="h-32 w-32 object-contain xl:h-40 xl:w-40"
                  />
                </motion.div>
              </div>
            )}
          </motion.div>
        </div>

        {cashedEntries.length > 0 ? (
          <div className="relative z-10 mt-4 grid gap-3 sm:grid-cols-2">
            {cashedEntries.map((entry) => (
              <div key={entry.entryId} className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-200/70">Locked Win</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-white">{formatMoney(entry.bet)}</span>
                  <span className="text-xl font-black text-emerald-300">{Number(entry.cashoutMultiplier || 0).toFixed(2)}x</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </motion.div>
    </div>
  );

  const rightPanel = (
    <div className="space-y-4 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">Joined Players</p>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/65">
            {players.length} in round
          </span>
        </div>

        <div className="mt-3 space-y-2">
          <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {topPlayers.length === 0 ? (
            <p className="text-sm text-white/55">No one has joined this round yet.</p>
          ) : (
            topPlayers.map((player) => (
              <div key={player.entryId} className="rounded-2xl bg-black/20 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <p className={`font-semibold ${player.isYou ? "text-emerald-200" : "text-white"}`}>{player.username}</p>
                    {player.isYou ? (
                      <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200">
                        You
                      </span>
                    ) : null}
                  </div>
                  <span
                    className={`text-xs font-bold uppercase tracking-[0.18em] ${
                      player.status === "cashed"
                        ? "text-emerald-300"
                        : player.status === "lost"
                          ? "text-rose-300"
                          : "text-sky-300"
                    }`}
                  >
                    {player.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                  <span className="text-white/65">{formatCrashValue(player.bet)}</span>
                  <span className="font-semibold text-white">
                    {player.status === "cashed"
                      ? `${Number(player.cashoutMultiplier || 0).toFixed(2)}x`
                      : player.autoCashout
                        ? `Auto ${Number(player.autoCashout).toFixed(2)}x`
                        : player.status === "lost"
                          ? "Busted"
                          : "Live"}
                  </span>
                </div>
              </div>
            ))
          )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-white/45">Recent Crashes</p>
        <div className="mt-3 space-y-2">
          {recentCrashHistory.length === 0 ? (
            <p className="text-sm text-white/55">Waiting for the first crash result.</p>
          ) : (
            recentCrashHistory.map((entry) => (
              <div key={entry.roundId} className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3 text-sm">
                <span className="text-white/65">Round {String(entry.roundId || "").replace("crashround_", "")}</span>
                <span className={`font-black ${Number(entry.crashPoint || 1) >= 2 ? "text-emerald-300" : "text-rose-300"}`}>
                  {Number(entry.crashPoint || 1).toFixed(2)}x
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <motion.aside
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="casino-card overflow-hidden rounded-[2rem] bg-gradient-to-br from-yellow-500/20 via-orange-500/10 to-sky-500/20 p-6"
      >
        <p className="text-xs uppercase tracking-[0.35em] text-white/45">Crash</p>
        <h2 className="mt-3 text-4xl font-black text-white">Live multiplayer crash</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
          Shared rounds, multiple slips, auto cashout targets, and manual exits while the rocket keeps running to the real crash point.
        </p>
      </motion.aside>

      <div className="grid gap-4 xl:grid-cols-[220px,minmax(0,1fr)] xl:gap-5">
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-[1.4rem] bg-white/5 p-4 backdrop-blur"
        >
          {controls}
        </motion.aside>

        <div className="min-w-0 space-y-4">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="min-w-0 overflow-visible rounded-[1.4rem] bg-white/5 p-4 backdrop-blur xl:p-6"
          >
            {main}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[1.4rem] bg-white/5 p-4 backdrop-blur xl:p-5"
          >
            {rightPanel}
          </motion.section>
        </div>
      </div>
    </div>
  );
}
