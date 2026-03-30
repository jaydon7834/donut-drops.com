import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";
import { FairnessCard } from "./FairnessCard.jsx";
import { GameLayout } from "./GameLayout.jsx";

function DiceResult({ roll, loading }) {
  return (
    <motion.div
      key={roll ?? "idle"}
      initial={{ rotate: 0, scale: 0.9, opacity: 0 }}
      animate={loading ? { rotate: 720, scale: [1, 1.06, 1], opacity: 1 } : { rotate: 720, scale: 1, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="text-6xl text-white font-black"
    >
      {roll !== undefined && roll !== null ? Number(roll).toFixed(2) : "--"}
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
  const [feedback, setFeedback] = useState({ text: "", tone: "neutral" });
  const [loading, setLoading] = useState(false);

  async function handleRoll() {
    setLoading(true);
    setFeedback({ text: "", tone: "neutral" });

    try {
      const data = await api.rollDice(token, {
        bet: parseBetInput(betInput),
        target,
        over: condition === "over",
        clientSeed
      });

      setResult(data.game);
      onBalanceChange(data.balance);
      setFeedback({
        text: data.game.result.isWin
          ? `Win locked in at ${data.game.result.multiplier}x.`
          : "House edge landed this one.",
        tone: data.game.result.isWin ? "win" : "loss"
      });
    } catch (error) {
      setFeedback({ text: error.message, tone: "loss" });
    } finally {
      setLoading(false);
    }
  }

  function handleBetInputChange(value) {
    setBetInput(value);
    const parsed = parseBetInput(value);
    if (parsed > 0) {
      setBetAmount(parsed);
    }
  }

  function adjustBet(multiplier) {
    const nextBet = Math.max(1, Math.round(parseBetInput(betInput || betAmount) * multiplier));
    setBetAmount(nextBet);
    setBetInput(formatBetInput(nextBet));
  }

  return (
    <GameLayout
      eyebrow="Dice"
      title="Dial in the edge and let it roll"
      subtitle="A cleaner stake-style dice table with a glowing target band, animated result reveal, and fast amount controls."
      accent="from-cyan-500/10 via-purple-500/5 to-orange-500/10"
      controls={
        <div className="space-y-4">
          <label className="rounded-2xl bg-white/5 p-4 text-sm text-white/70 block">
                Bet Amount
                <div className="mt-2 flex overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  <input
                    value={betInput}
                    onChange={(event) => handleBetInputChange(event.target.value)}
                    className="w-full bg-transparent px-3 py-2 text-white outline-none"
                    placeholder="1m"
                  />
                  <div className="flex items-center gap-1 px-2">
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
                <p className="mt-2 text-xs text-white/40">Supports 10k, 1m, 1b and more.</p>
          </label>
          <label className="rounded-2xl bg-white/5 p-4 text-sm text-white/70 block">
                Client Seed
                <input
                  value={clientSeed}
                  onChange={(event) => setClientSeed(event.target.value)}
                  className="casino-input mt-2"
                />
          </label>
          <label className="rounded-2xl bg-white/5 p-4 text-sm text-white/70 block">
                Target
                <input
                  type="range"
                  min="2"
                  max="98"
                  value={target}
                  onChange={(event) => setTarget(Number(event.target.value))}
                  className="mt-4 w-full accent-emerald-400"
                />
                <div className="mt-3 flex items-center justify-between text-xs text-white/45">
                  <span>2</span>
                  <span className="text-sm font-semibold text-white">{target}</span>
                  <span>98</span>
                </div>
          </label>
          <label className="rounded-2xl bg-white/5 p-4 text-sm text-white/70 block">
                Condition
                <select
                  value={condition}
                  onChange={(event) => setCondition(event.target.value)}
                  className="casino-input mt-2"
                >
                  <option value="under">Roll Under</option>
                  <option value="over">Roll Over</option>
                </select>
          </label>
          <button
              type="button"
              onClick={handleRoll}
              disabled={loading}
              className="neon-button w-full text-white disabled:opacity-50"
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
      }
      main={
        <div className="space-y-5">
          <div className="rounded-[1.8rem] border border-white/6 bg-[#111621] p-5">
            <div className="flex items-center justify-between text-sm text-white/55">
              <span>Win zone</span>
              <span>{condition === "under" ? `0 - ${target}` : `${target} - 100`}</span>
            </div>
            <div className="mt-4 h-4 overflow-hidden rounded-full bg-white/5">
              <motion.div
                animate={{
                  width: `${condition === "under" ? target : 100 - target}%`,
                  marginLeft: condition === "under" ? "0%" : `${target}%`
                }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
              />
            </div>
            <div className="mt-8 rounded-[1.5rem] bg-[#0d1320] p-8 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">Roll Result</p>
              <div className="mt-5 flex justify-center">
                <DiceResult roll={loading ? null : result?.result?.roll} loading={loading} />
              </div>
              <p className="mt-3 text-white/60">{result?.result?.isWin ? "Winning throw" : "Waiting for the next roll"}</p>
            </div>
          </div>

          {result && (
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-white/50">Roll</p>
                <p className="mt-2 text-2xl font-semibold text-white">{result.result.roll}</p>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-white/50">Multiplier</p>
                <p className="mt-2 text-2xl font-semibold text-white">{result.result.multiplier}x</p>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-white/50">Payout</p>
                <p className="mt-2 text-2xl font-semibold text-mint">${result.payout.toFixed(2)}</p>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-white/50">Result</p>
                <p className="mt-2 text-2xl font-semibold text-white">{result.result.isWin ? "Win" : "Loss"}</p>
              </div>
            </div>
          )}
        </div>
      }
      side={
        <FairnessCard
          title="Dice seed reveal"
          data={
            result
              ? {
                  hash: result.provablyFair.hash,
                  serverSeedHash: result.provablyFair.serverSeedHash,
                  serverSeed: result.provablyFair.serverSeed,
                  clientSeed: result.provablyFair.clientSeed,
                  nonce: result.provablyFair.nonce
                }
              : null
          }
        />
      }
    />
  );
}
