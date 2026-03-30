import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";

const totalSteps = 10;

export function ChickenGame({ token, onBalanceChange, onBack }) {
  const [betAmount, setBetAmount] = useState(10);
  const [betInput, setBetInput] = useState("10");
  const [game, setGame] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

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

  async function handleStart() {
    setLoading(true);
    setFeedback("");

    try {
      const data = await api.startChicken(token, {
        bet: parseBetInput(betInput)
      });

      setGame(data.game);
      onBalanceChange(data.balance);
      setFeedback("Run started. Step forward or cash out.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStep() {
    if (!game?.active) {
      return;
    }

    setLoading(true);

    try {
      const data = await api.stepChicken(token, { gameId: game.gameId });
      setGame(data.game);
      onBalanceChange(data.balance);
      setFeedback(
        data.game.result === "lose"
          ? "💀 You died"
          : `Safe step. Multiplier is now ${data.game.multiplier.toFixed(2)}x.`
      );
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCashout() {
    if (!game?.active) {
      return;
    }

    setLoading(true);

    try {
      const data = await api.cashoutChicken(token, { gameId: game.gameId });
      setGame(data.game);
      onBalanceChange(data.balance);
      setFeedback(`Cashed out for $${data.payout.toFixed(2)}.`);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-[300px_1fr] gap-6 p-6">
      <div className="bg-[#0f172a] rounded-2xl p-5">
        <div className="space-y-4 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-indigo-200/65">Chicken Bet</p>
            <h2 className="mt-3 text-3xl font-black text-white">Cross the road</h2>
          </div>

          <div>
            <p className="text-sm text-gray-400">Amount</p>
            <div className="mt-2 flex overflow-hidden rounded-lg bg-[#1e293b]">
              <input
                value={betInput}
                onChange={(event) => handleBetInputChange(event.target.value)}
                className="w-full bg-transparent p-3 text-white outline-none"
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
              <span className="text-white/65">Step</span>
              <span className="font-bold text-white">{game?.step || 0}/{totalSteps}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-white/65">Multiplier</span>
              <span className="font-bold text-white">{(game?.multiplier || 1).toFixed(2)}x</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-white/65">Survival Chance</span>
              <span className="font-bold text-emerald-300">75% per step</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStart}
            disabled={loading || Boolean(game?.active)}
            className="w-full rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 disabled:opacity-50"
          >
            {loading && !game?.active ? "Starting..." : "Start Round"}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleStep}
              disabled={loading || !game?.active}
              className="rounded-xl bg-white/10 px-4 py-3 font-bold text-white disabled:opacity-50"
            >
              Step
            </button>
            <button
              type="button"
              onClick={handleCashout}
              disabled={loading || !game?.active}
              className="rounded-xl bg-orange-500 px-4 py-3 font-bold text-slate-950 disabled:opacity-50"
            >
              Cash Out
            </button>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-white/25 hover:text-white"
          >
            Back To Lobby
          </button>

          {feedback && <p className="text-sm text-white/70">{feedback}</p>}
        </div>
      </div>

      <div className="bg-[#0b0f1a] rounded-2xl p-6 flex flex-col items-center">
        <div className="w-full rounded-2xl bg-[#0d0f18] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-indigo-200/65">Chicken Road</p>

          <div className="relative mt-8 min-h-[460px] overflow-hidden rounded-2xl border border-white/6 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_45%),linear-gradient(180deg,#090a12,#0c0d17)]">
            <div className="absolute inset-x-0 top-[22%] border-t border-white/10" />
            <div className="absolute inset-x-0 top-[54%] border-t border-white/10" />
            <div className="absolute inset-x-0 bottom-5 border-t border-white/10" />

            {Array.from({ length: totalSteps }).map((_, index) => {
              const bottom = 30 + index * 36;
              const reached = (game?.step || 0) > index;

              return (
                <div
                  key={index}
                  className={`absolute left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full text-sm font-bold transition ${
                    reached ? "bg-emerald-500 text-slate-950 shadow-[0_0_25px_rgba(34,197,94,0.3)]" : "bg-white/10 text-white/45"
                  }`}
                  style={{ bottom: `${bottom}px` }}
                >
                  {index + 1}x
                </div>
              );
            })}

            <motion.div
              animate={{ y: -((game?.step || 0) * 36) }}
              transition={{ duration: 0.35 }}
              className="absolute left-1/2 bottom-6 -translate-x-1/2 text-4xl drop-shadow-[0_0_20px_rgba(250,204,21,0.45)]"
            >
              🐔
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
