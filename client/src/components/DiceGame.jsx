import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { FairnessCard } from "./FairnessCard.jsx";

export function DiceGame({ token, user, onBalanceChange }) {
  const [betAmount, setBetAmount] = useState(20);
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
        bet: betAmount,
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

  return (
    <div className="space-y-5">
      <section className="glass-panel rounded-3xl p-5">
        <div className="grid gap-5 lg:grid-cols-[1fr,0.95fr]">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">Dice</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Dial in the edge and let it roll</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="rounded-2xl bg-white/5 p-4 text-sm text-white/70">
                Bet Amount
                <input
                  type="number"
                  min="1"
                  value={betAmount}
                  onChange={(event) => setBetAmount(Number(event.target.value))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-accent"
                />
              </label>
              <label className="rounded-2xl bg-white/5 p-4 text-sm text-white/70">
                Client Seed
                <input
                  value={clientSeed}
                  onChange={(event) => setClientSeed(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-accent"
                />
              </label>
              <label className="rounded-2xl bg-white/5 p-4 text-sm text-white/70 sm:col-span-2">
                Target
                <input
                  type="range"
                  min="2"
                  max="98"
                  value={target}
                  onChange={(event) => setTarget(Number(event.target.value))}
                  className="mt-4 w-full accent-highlight"
                />
                <div className="mt-3 flex items-center justify-between text-xs text-white/45">
                  <span>2</span>
                  <span className="text-sm font-semibold text-white">{target}</span>
                  <span>98</span>
                </div>
              </label>
              <label className="rounded-2xl bg-white/5 p-4 text-sm text-white/70">
                Condition
                <select
                  value={condition}
                  onChange={(event) => setCondition(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-accent"
                >
                  <option value="under">Roll Under</option>
                  <option value="over">Roll Over</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              onClick={handleRoll}
              disabled={loading}
              className="rounded-2xl bg-highlight px-5 py-3 font-semibold text-white disabled:opacity-50"
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

            {result && (
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-sm text-white/50">Roll</p>
                  <motion.p
                    key={result.result.roll}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-2 text-2xl font-semibold text-white"
                  >
                    {result.result.roll}
                  </motion.p>
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
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {result.result.isWin ? "Win" : "Loss"}
                  </p>
                </div>
              </div>
            )}
          </div>

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
        </div>
      </section>
    </div>
  );
}
