import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";

export function LimboGame({ token, user, onBalanceChange, onBack }) {
  const [betAmount, setBetAmount] = useState(20);
  const [betInput, setBetInput] = useState("20");
  const [target, setTarget] = useState(2);
  const [targetInput, setTargetInput] = useState("2.00");
  const [clientSeed, setClientSeed] = useState(user.clientSeed || "donutdrop-default");
  const [multiplier, setMultiplier] = useState(null);
  const [result, setResult] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [feedback, setFeedback] = useState("");
  const rollingIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (rollingIntervalRef.current) {
        window.clearInterval(rollingIntervalRef.current);
      }
    };
  }, []);

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

  function handleTargetChange(value) {
    const parsed = Number(value);
    setTargetInput(value);

    if (Number.isFinite(parsed)) {
      const clamped = Math.min(100, Math.max(1.01, parsed));
      setTarget(Number(clamped.toFixed(2)));
    }
  }

  async function playLimbo() {
    setRolling(true);
    setFeedback("");
    setResult(null);

    rollingIntervalRef.current = window.setInterval(() => {
      setMultiplier((Math.random() * 5 + 1).toFixed(2));
    }, 50);

    try {
      const data = await api.rollLimbo(token, {
        bet: parseBetInput(betInput),
        target,
        clientSeed
      });

      if (rollingIntervalRef.current) {
        window.clearInterval(rollingIntervalRef.current);
        rollingIntervalRef.current = null;
      }

      window.setTimeout(() => {
        setMultiplier(data.game.multiplier.toFixed(2));
        setResult(data.game.win ? "win" : "lose");
        setRolling(false);
      }, 700);

      onBalanceChange(data.balance);
      setFeedback(
        data.game.win
          ? `YOU WON $${data.game.payout.toFixed(2)}`
          : "YOU LOST"
      );
    } catch (error) {
      if (rollingIntervalRef.current) {
        window.clearInterval(rollingIntervalRef.current);
        rollingIntervalRef.current = null;
      }
      setRolling(false);
      setMultiplier(null);
      setResult(null);
      setFeedback(error.message);
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 p-4 xl:flex-row xl:items-stretch xl:p-6">
      <div className="w-full shrink-0 rounded-2xl bg-[#0f172a] p-5 xl:w-[220px]">
        <div className="space-y-4 text-white">
          <div>
            <p className="text-gray-400 text-sm">Bet Amount</p>
            <div className="mt-2 flex overflow-hidden rounded-xl bg-[#1e293b]">
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

          <div>
            <p className="text-gray-400 text-sm">Target Multiplier</p>
            <input
              value={targetInput}
              onChange={(event) => handleTargetChange(event.target.value)}
              className="mt-2 w-full p-3 bg-[#1e293b] rounded-xl text-white outline-none"
            />
          </div>

          <input
            type="range"
            min="1.01"
            max="100"
            step="0.01"
            value={target}
            onChange={(event) => {
              const nextTarget = Number(event.target.value);
              setTarget(nextTarget);
              setTargetInput(nextTarget.toFixed(2));
            }}
            className="w-full accent-emerald-400"
          />

          <div>
            <p className="text-gray-400 text-sm">Client Seed</p>
            <input
              value={clientSeed}
              onChange={(event) => setClientSeed(event.target.value)}
              className="mt-2 w-full p-3 bg-[#1e293b] rounded-xl text-white outline-none"
            />
          </div>

          <button
            type="button"
            onClick={playLimbo}
            disabled={rolling}
            className="w-full bg-green-500 hover:bg-green-600 p-3 rounded-xl font-bold text-slate-950 disabled:opacity-50"
          >
            {rolling ? "Rolling..." : "Place Bet"}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-white/25 hover:text-white"
          >
            Back To Lobby
          </button>
        </div>
      </div>

      <div className="min-w-0 flex-1 rounded-2xl bg-[#0b0f1a] p-6 shadow-[0_0_40px_rgba(34,197,94,0.12)]">
        <div className="flex h-full w-full flex-col items-center justify-center overflow-hidden">
          <div className="text-gray-400 mb-4">ROLLED MULTIPLIER</div>

          <motion.div
            key={multiplier ?? "idle"}
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            className={`text-7xl font-bold ${
              result === "win" ? "text-green-400" : result === "lose" ? "text-red-400" : "text-white"
            }`}
          >
            {multiplier ? `${multiplier}x` : "--"}
          </motion.div>

          <div className="mt-6 text-xl">
            {result === "win" && <span className="text-green-400">YOU WON 💰</span>}
            {result === "lose" && <span className="text-red-400">YOU LOST 💀</span>}
          </div>

          {feedback && <p className="mt-5 text-sm text-white/65">{feedback}</p>}
        </div>
      </div>
    </div>
  );
}
