import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";

function AnimatedRoll({ roll, outcome }) {
  const toneClass =
    outcome === "win"
      ? "text-green-400"
      : outcome === "loss"
      ? "text-red-400"
      : "text-white";

  return (
    <motion.div
      key={roll ?? "idle"}
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`text-6xl font-bold ${toneClass}`}
    >
      {roll ?? "--"}
    </motion.div>
  );
}

export function DiceGame({ token, user, onBalanceChange }) {
  const [betAmount, setBetAmount] = useState(20);
  const [betInput, setBetInput] = useState("20");
  const [target, setTarget] = useState(55);
  const [condition, setCondition] = useState("under");
  const [clientSeed, setClientSeed] = useState(user.clientSeed || "donutdrop-default");
  const [result, setResult] = useState(null);
  const [displayRoll, setDisplayRoll] = useState("--");
  const [feedback, setFeedback] = useState({ text: "", tone: "neutral" });
  const [loading, setLoading] = useState(false);
  const rollingIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (rollingIntervalRef.current) {
        window.clearInterval(rollingIntervalRef.current);
      }
    };
  }, []);

  const winChance = useMemo(
    () => (condition === "under" ? target : 100 - target).toFixed(2),
    [condition, target]
  );
  const multiplier = useMemo(() => (99 / Number(winChance)).toFixed(2), [winChance]);
  const profitPreview = useMemo(() => {
    const parsedBet = parseBetInput(betInput) || betAmount;
    return Math.max(parsedBet * Number(multiplier) - parsedBet, 0).toFixed(2);
  }, [betAmount, betInput, multiplier]);
  const outcome = result?.result?.isWin ? "win" : result ? "loss" : "neutral";

  async function handleRoll() {
    setLoading(true);
    setFeedback({ text: "", tone: "neutral" });

    rollingIntervalRef.current = window.setInterval(() => {
      setDisplayRoll((Math.random() * 100).toFixed(2));
    }, 50);

    try {
      const data = await api.rollDice(token, {
        bet: parseBetInput(betInput),
        target,
        over: condition === "over",
        clientSeed
      });

      if (rollingIntervalRef.current) {
        window.clearInterval(rollingIntervalRef.current);
        rollingIntervalRef.current = null;
      }

      window.setTimeout(() => {
        setDisplayRoll(Number(data.game.result.roll).toFixed(2));
      }, 500);

      setResult(data.game);
      onBalanceChange(data.balance);
      setFeedback({
        text: data.game.result.isWin
          ? `Win locked in at ${data.game.result.multiplier}x.`
          : "House edge landed this one.",
        tone: data.game.result.isWin ? "win" : "loss"
      });
    } catch (error) {
      if (rollingIntervalRef.current) {
        window.clearInterval(rollingIntervalRef.current);
        rollingIntervalRef.current = null;
      }
      setDisplayRoll("--");
      setFeedback({ text: error.message, tone: "loss" });
    } finally {
      window.setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }

  function handleBetInputChange(value) {
    setBetInput(value);
    const parsed = parseBetInput(value);
    if (parsed > 0) {
      setBetAmount(parsed);
    }
  }

  function adjustBet(multiplierValue) {
    const nextBet = Math.max(1, Math.round(parseBetInput(betInput || betAmount) * multiplierValue));
    setBetAmount(nextBet);
    setBetInput(formatBetInput(nextBet));
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 p-4 xl:flex-row xl:items-stretch xl:p-6">
      <div className="w-full shrink-0 rounded-2xl bg-[#0f172a] p-5 text-white xl:w-[260px]">
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
              <button
                type="button"
                onClick={() => adjustBet(0.5)}
                className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-white"
              >
                1/2
              </button>
              <button
                type="button"
                onClick={() => adjustBet(2)}
                className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-white"
              >
                2x
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setCondition("under")}
            className={`w-full p-3 rounded-xl transition ${
              condition === "under" ? "bg-gray-600 text-white" : "bg-[#1e293b] text-white/75"
            }`}
          >
            ↓ Under
          </button>
          <button
            type="button"
            onClick={() => setCondition("over")}
            className={`w-full p-3 rounded-xl transition ${
              condition === "over" ? "bg-gray-600 text-white" : "bg-[#1e293b] text-white/75"
            }`}
          >
            ↑ Over
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Target</p>
            <span className="font-semibold">{target}</span>
          </div>
          <input
            type="range"
            min="2"
            max="98"
            value={target}
            onChange={(event) => setTarget(Number(event.target.value))}
            className="mt-3 w-full accent-emerald-400"
          />
        </div>

        <div>
          <p className="text-sm text-gray-400">Client Seed</p>
          <input
            value={clientSeed}
            onChange={(event) => setClientSeed(event.target.value)}
            className="mt-2 w-full rounded-lg bg-[#1e293b] p-3 text-white outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-[#1e293b] p-3 rounded-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Win Chance</p>
            <p className="mt-2 text-lg font-bold text-white">{winChance}%</p>
          </div>
          <div className="bg-[#1e293b] p-3 rounded-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Profit</p>
            <p className="mt-2 text-lg font-bold text-green-400">${profitPreview}</p>
          </div>
          <div className="bg-[#1e293b] p-3 rounded-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Multiplier</p>
            <p className="mt-2 text-lg font-bold text-white">{multiplier}x</p>
          </div>
          <div className="bg-[#1e293b] p-3 rounded-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-white/45">Win Zone</p>
            <p className="mt-2 text-sm font-bold text-white">
              {condition === "under" ? `0 - ${target}` : `${target} - 100`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRoll}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 p-3 rounded-xl font-bold text-black disabled:opacity-50"
        >
          {loading ? "Rolling..." : "Roll Dice"}
        </button>

        {feedback.text && (
          <motion.p
            key={feedback.text}
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: 1,
              y: 0,
              x: feedback.tone === "loss" ? [0, -3, 3, -3, 0] : 0
            }}
            className={`rounded-2xl px-4 py-3 text-sm ${
              feedback.tone === "win"
                ? "bg-emerald-500/10 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                : feedback.tone === "loss"
                ? "bg-rose-500/10 text-rose-200"
                : "bg-white/5 text-white/70"
            }`}
          >
            {feedback.text}
          </motion.p>
        )}
      </div>

      <div className="min-w-0 flex-1 rounded-2xl bg-[#0b0f1a] p-8">
        <div className="flex h-full w-full flex-col items-center justify-center overflow-hidden">
        <div className="text-gray-400 mb-4">ROLLED NUMBER</div>

        <div className="mb-6">
          <AnimatedRoll roll={displayRoll} outcome={outcome} />
        </div>

        <div className="w-full max-w-xl h-6 rounded-full overflow-hidden flex">
          {condition === "under" ? (
            <>
              <div className="bg-green-500" style={{ width: `${target}%` }} />
              <div className="bg-red-500 flex-1" />
            </>
          ) : (
            <>
              <div className="bg-red-500" style={{ width: `${target}%` }} />
              <div className="bg-green-500 flex-1" />
            </>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-400">
          Win zone: {condition === "under" ? `0 - ${target}` : `${target} - 100`}
        </div>

        {result && (
          <div className="mt-8 grid w-full max-w-xl grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#111827] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Payout</p>
              <p className="mt-2 text-2xl font-bold text-emerald-300">${result.payout.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-[#111827] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Result</p>
              <p className={`mt-2 text-2xl font-bold ${result.result.isWin ? "text-green-400" : "text-red-400"}`}>
                {result.result.isWin ? "Win" : "Lose"}
              </p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
