import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { createAppSocket } from "../lib/socket.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";
import { triggerGameEffect } from "../lib/gameEffects.js";
import { GameLayout } from "./GameLayout.jsx";

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function buildCrashPath(history) {
  const points = history?.length ? history : [1];
  const maxValue = Math.max(...points, 1.1);

  return points
    .map((value, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * 100;
      const normalized = Math.log(value) / Math.log(maxValue);
      const y = 88 - normalized * 72;
      return `${index === 0 ? "M" : "L"} ${x} ${Math.max(12, y)}`;
    })
    .join(" ");
}

export function CrashGame({ token, user, onBalanceChange, onBack }) {
  const [betInput, setBetInput] = useState("20");
  const [round, setRound] = useState(null);
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadState() {
      try {
        const data = await api.getCrashState(token);
        if (!cancelled) {
          setRound(data.round);
          setHistory(data.history || []);
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

      const self = payload?.activeBet;

      if (payload?.status === "crashed" && self?.status === "active") {
        triggerGameEffect("loss");
      }

      if (payload?.status === "crashed" && self?.status === "cashed") {
        triggerGameEffect(self.payout >= self.bet * 3 ? "big-win" : "win");
      }
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [token, user]);

  const currentMultiplier = Number(round?.multiplier || 1).toFixed(2);
  const graphPath = useMemo(() => buildCrashPath(round?.history || [1]), [round?.history]);
  const countdownSeconds = Math.max(
    0,
    Math.ceil(((round?.bettingClosesAt || 0) - Date.now()) / 1000)
  );
  const activeBet = round?.activeBet;
  const canJoin = round?.status === "countdown" && !activeBet;
  const canCashout = round?.status === "running" && activeBet?.status === "active";
  const players = round?.players || [];

  function handleBetInputChange(value) {
    setBetInput(value);
  }

  function adjustBet(multiplier) {
    const nextBet = Math.max(1, Math.round(parseBetInput(betInput || 0) * multiplier));
    setBetInput(formatBetInput(nextBet));
  }

  async function handleJoin() {
    setLoading("join");
    setFeedback("");

    try {
      const data = await api.placeCrashBet(token, {
        bet: parseBetInput(betInput)
      });
      setRound(data.round);
      onBalanceChange(data.balance);
      setFeedback("You joined the live crash round.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading("");
    }
  }

  async function handleCashout() {
    setLoading("cashout");
    setFeedback("");

    try {
      const data = await api.cashoutCrash(token);
      setRound(data.round);
      onBalanceChange(data.balance);
      triggerGameEffect(data.payout >= parseBetInput(betInput) * 3 ? "big-win" : "win");
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
        <h2 className="mt-3 text-3xl font-black text-white">Ride the curve</h2>
      </div>

      <div>
        <p className="text-sm text-gray-400">Bet Amount</p>
        <div className="mt-2 flex overflow-hidden rounded-lg bg-[#1e293b]">
          <input
            value={betInput}
            onChange={(event) => handleBetInputChange(event.target.value)}
            className="w-full bg-transparent p-3 text-white outline-none"
            placeholder="1m"
          />
          <div className="flex items-center gap-1 pr-2">
            <button type="button" onClick={() => adjustBet(0.5)} className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-white">
              1/2
            </button>
            <button type="button" onClick={() => adjustBet(2)} className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-white">
              2x
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-[#171b2a] p-4">
        <div className="flex items-center justify-between">
          <p className="text-white/65">Round</p>
          <span className="font-bold text-white">{round?.roundId || "Loading"}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-white/65">Status</p>
          <span className="font-bold text-white capitalize">{round?.status || "idle"}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-white/65">Players</p>
          <span className="font-bold text-white">{round?.playerCount || 0}</span>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-white/65">Pot</p>
          <span className="font-bold text-white">{formatMoney(round?.totalBet || 0)}</span>
        </div>
      </div>

      {canJoin ? (
        <button
          type="button"
          onClick={handleJoin}
          disabled={loading !== ""}
          className="w-full rounded-xl bg-sky-500 px-4 py-4 text-lg font-bold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50"
        >
          {loading === "join" ? "Joining..." : countdownSeconds > 0 ? `Join Round (${countdownSeconds}s)` : "Join Round"}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleCashout}
          disabled={!canCashout || loading !== ""}
          className="w-full rounded-xl bg-emerald-500 px-4 py-4 text-lg font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {loading === "cashout" ? "Cashing Out..." : activeBet?.status === "cashed" ? `Cashed ${activeBet.cashoutMultiplier.toFixed(2)}x` : "Cash Out"}
        </button>
      )}

      {feedback && <p className="text-sm text-white/70">{feedback}</p>}
    </div>
  );

  const main = (
    <div className="space-y-5">
      <div className="rounded-[1.8rem] border border-white/10 bg-[#0b0f1a] p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/45">Live Round</p>
            <h3 className={`mt-3 text-5xl font-black ${round?.status === "crashed" ? "text-rose-300" : "text-emerald-300"}`}>
              {round?.status === "crashed" ? `💥 ${Number(round?.crashPoint || 1).toFixed(2)}x` : `${currentMultiplier}x`}
            </h3>
          </div>
          {activeBet ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Your Bet</p>
              <p className="mt-2 text-2xl font-black text-white">{formatMoney(activeBet.bet)}</p>
              <p className="mt-1 text-sm text-white/65">
                {activeBet.status === "cashed"
                  ? `Locked at ${Number(activeBet.cashoutMultiplier || 0).toFixed(2)}x`
                  : activeBet.status === "active"
                    ? "Still riding"
                    : "Missed the cashout"}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-6 rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,#0d1630,#0c1220)] p-4">
          <svg viewBox="0 0 100 100" className="h-72 w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="crashGraphFill" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(34,197,94,0.30)" />
                <stop offset="100%" stopColor="rgba(34,197,94,0)" />
              </linearGradient>
            </defs>
            <path d={`${graphPath} L 100 100 L 0 100 Z`} fill="url(#crashGraphFill)" />
            <path
              d={graphPath}
              fill="none"
              stroke={round?.status === "crashed" ? "#fb7185" : "#00ff88"}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );

  const rightPanel = (
    <div className="space-y-4 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-white/45">Round Notes</p>
        <p className="mt-3 text-sm leading-6 text-white/70">
          Cashing out locks your payout, but the shared round keeps running until everyone sees where it really crashes.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-white/45">Players</p>
        <div className="mt-3 space-y-2">
          {players.length === 0 ? (
            <p className="text-sm text-white/55">No one has joined this round yet.</p>
          ) : (
            players.map((player) => (
              <div key={player.userId} className="rounded-2xl bg-black/20 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white">{player.username}</p>
                  <span className={`text-xs font-bold uppercase tracking-[0.18em] ${
                    player.status === "cashed" ? "text-emerald-300" : player.status === "lost" ? "text-rose-300" : "text-sky-300"
                  }`}>
                    {player.status}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/65">
                  Bet {formatMoney(player.bet)}
                  {player.status === "cashed" ? ` • ${Number(player.cashoutMultiplier || 0).toFixed(2)}x` : ""}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-white/45">Recent Crashes</p>
        <div className="mt-3 space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-white/55">Waiting for the first crash result.</p>
          ) : (
            history.map((entry) => (
              <div key={entry.roundId} className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3 text-sm">
                <span className="text-white/65">{entry.roundId}</span>
                <span className="font-black text-white">{Number(entry.crashPoint || 1).toFixed(2)}x</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return (
    <GameLayout
      eyebrow="Crash"
      title="Stake-style live crash"
      subtitle="Join the shared round, cash out before the line breaks, and still watch the live curve finish to the real crash point."
      accent="from-yellow-500/20 via-transparent to-sky-500/20"
      controls={controls}
      main={main}
      rightPanel={rightPanel}
    />
  );
}
