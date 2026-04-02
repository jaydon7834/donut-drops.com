import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";
import { triggerGameEffect } from "../lib/gameEffects.js";

const totalSteps = 10;

function getChickenHouseEdgeFactor(bet) {
  const normalizedBet = Number(bet) || 1_000;

  if (normalizedBet >= 100_000_000) {
    return 0.6;
  }

  if (normalizedBet >= 10_000_000) {
    return 0.65;
  }

  if (normalizedBet >= 1_000_000) {
    return 0.7;
  }

  if (normalizedBet >= 100_000) {
    return 0.75;
  }

  return 0.8;
}

function previewChickenMultiplier(step, surviveChance, bet) {
  const fairMultiplier = Math.pow(1 / surviveChance, step);
  return Math.min(Number((fairMultiplier * getChickenHouseEdgeFactor(bet)).toFixed(2)), 100);
}

export function ChickenGame({ token, onBalanceChange, onBack }) {
  const [betAmount, setBetAmount] = useState(0);
  const [betInput, setBetInput] = useState("");
  const [risk, setRisk] = useState("medium");
  const [game, setGame] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [startingRound, setStartingRound] = useState(false);
  const [stepping, setStepping] = useState(false);
  const [cashingOut, setCashingOut] = useState(false);
  const [showDeathOverlay, setShowDeathOverlay] = useState(false);
  const [deathStage, setDeathStage] = useState("idle");
  const liveBetAmount = parseBetInput(betInput || betAmount || 0);

  const survivalChance =
    game?.surviveChance || (risk === "low" ? 0.8 : risk === "high" ? 0.7 : 0.75);
  const nextMultiplier = previewChickenMultiplier((game?.step || 0) + 1, survivalChance, game?.bet || liveBetAmount);
  const riskMultiplierPreview = [
    { key: "low", chance: 0.8 },
    { key: "medium", chance: 0.75 },
    { key: "high", chance: 0.7 }
  ].map((entry) => ({
    ...entry,
    value: previewChickenMultiplier((game?.step || 0) + 1, entry.chance, game?.bet || liveBetAmount)
  }));
  const roadMultipliers = Array.from({ length: totalSteps }, (_, index) =>
    previewChickenMultiplier(index + 1, survivalChance, game?.bet || liveBetAmount)
  );
  const chickenBottom = useMemo(() => 24 + (game?.step || 0) * 36, [game?.step]);

  useEffect(() => {
    if (deathStage !== "abducting") {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setDeathStage("complete");
      setShowDeathOverlay(true);
    }, 1700);

    return () => window.clearTimeout(timerId);
  }, [deathStage]);

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
    setStartingRound(true);
    setFeedback("");
    setShowDeathOverlay(false);
    setDeathStage("idle");

    try {
      const data = await api.startChicken(token, {
        bet: parseBetInput(betInput),
        risk
      });

      setGame(data.game);
      onBalanceChange(data.balance);
      setFeedback("Run started. Step forward or cash out.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
      setStartingRound(false);
    }
  }

  async function handleStep() {
    if (!game?.active) {
      return;
    }

    setLoading(true);
    setStepping(true);
    setFeedback("Crossing...");

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 450));
      const data = await api.stepChicken(token, { gameId: game.gameId });
      setGame(data.game);
      onBalanceChange(data.balance);
      triggerGameEffect(data.game.result === "lose" ? "loss" : "win");
      setDeathStage(data.game.result === "lose" ? "abducting" : "idle");
      setShowDeathOverlay(false);
      setFeedback(
        data.game.result === "lose"
          ? "YOU DIED"
          : `Safe step. Multiplier is now ${data.game.multiplier.toFixed(2)}x.`
      );
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
      setStepping(false);
    }
  }

  async function handleCashout() {
    if (!game?.active) {
      return;
    }

    setLoading(true);
    setCashingOut(true);

    try {
      const data = await api.cashoutChicken(token, { gameId: game.gameId });
      setGame(data.game);
      onBalanceChange(data.balance);
      triggerGameEffect(
        Number(data.payout || 0) >= Number(data.game?.bet || 0) * 3 ? "big-win" : "win"
      );
      setFeedback(`Cashed out for $${data.payout.toFixed(2)}.`);
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
      setCashingOut(false);
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 p-4 xl:flex-row xl:items-stretch xl:p-6">
      <div className="w-full shrink-0 rounded-2xl bg-[#0f172a] p-5 xl:w-[220px]">
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

          <div className="rounded-2xl bg-[#171b2a] p-4">
            <div className="mb-3">
              <p className="text-white/65">Risk</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {["low", "medium", "high"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setRisk(mode)}
                    disabled={Boolean(game?.active)}
                    className={`rounded-xl px-3 py-2 text-sm font-bold capitalize transition ${
                      (game?.risk || risk) === mode
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-white/10 text-white/75"
                    } disabled:opacity-60`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                {riskMultiplierPreview.map((entry) => (
                  <div
                    key={entry.key}
                    className={`rounded-xl px-2 py-2 ${
                      (game?.risk || risk) === entry.key
                        ? "bg-emerald-500/20 text-emerald-200"
                        : "bg-white/5 text-white/55"
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">{entry.key}</p>
                    <p className="mt-1 text-sm font-black text-white">{entry.value.toFixed(2)}x</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/65">Step</span>
              <span className="font-bold text-white">
                {game?.step || 0}/{totalSteps}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-white/65">Multiplier</span>
              <span className="font-bold text-white">{(game?.multiplier || 1).toFixed(2)}x</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-white/65">Next Multiplier</span>
              <span className="font-bold text-amber-300">{nextMultiplier.toFixed(2)}x</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStart}
            disabled={loading || Boolean(game?.active)}
            className="w-full rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 disabled:opacity-50"
          >
            {startingRound ? "Starting..." : "Start Round"}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleStep}
              disabled={loading || !game?.active}
              className="rounded-xl bg-white/10 px-4 py-3 font-bold text-white disabled:opacity-50"
            >
              {stepping ? "Stepping..." : "Step"}
            </button>
            <button
              type="button"
              onClick={handleCashout}
              disabled={loading || !game?.active}
              className="rounded-xl bg-orange-500 px-4 py-3 font-bold text-slate-950 disabled:opacity-50"
            >
              {cashingOut ? "Cashing Out..." : "Cash Out"}
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

      <div className="min-w-0 flex-1 rounded-2xl bg-[#0b0f1a] p-6">
        <div className="w-full rounded-2xl bg-[#0d0f18] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-indigo-200/65">Chicken Road</p>

          <div className="relative mt-8 min-h-[460px] overflow-hidden rounded-2xl border border-white/6 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_45%),linear-gradient(180deg,#090a12,#0c0d17)]">
            <div className="absolute inset-x-0 top-[22%] border-t border-white/10" />
            <div className="absolute inset-x-0 top-[54%] border-t border-white/10" />
            <div className="absolute inset-x-0 bottom-5 border-t border-white/10" />

            {Array.from({ length: totalSteps }).map((_, index) => {
              const bottom = 30 + index * 36;
              const reached = (game?.step || 0) > index;
              const label = `${roadMultipliers[index].toFixed(2)}x`;

              return (
                <div
                  key={index}
                  className={`absolute left-1/2 flex h-12 min-w-[3.5rem] -translate-x-1/2 items-center justify-center rounded-full px-2 text-sm font-bold transition ${
                    reached
                      ? "bg-emerald-500 text-slate-950 shadow-[0_0_25px_rgba(34,197,94,0.3)]"
                      : "bg-white/10 text-white/45"
                  }`}
                  style={{ bottom: `${bottom}px` }}
                >
                  {label}
                </div>
              );
            })}

            <motion.div
              animate={{
                y: deathStage === "abducting" ? [0, -24, -80, -150] : -((game?.step || 0) * 36),
                opacity: deathStage === "abducting" ? [1, 1, 0.85, 0] : 1,
                scale: deathStage === "abducting" ? [1, 0.94, 0.75, 0.3] : 1
              }}
              transition={{ duration: deathStage === "abducting" ? 1.4 : 0.35 }}
              className="absolute left-1/2 bottom-6 -translate-x-1/2 text-lg font-black text-amber-200 drop-shadow-[0_0_20px_rgba(250,204,21,0.45)]"
            >
              🐔
            </motion.div>

            {deathStage === "abducting" && (
              <motion.div
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0.95],
                  x: [0, 0, 22, 180],
                  y: [0, -20, -120, -260]
                }}
                transition={{ duration: 1.45, ease: "easeInOut" }}
                className="absolute left-1/2 z-10 -translate-x-1/2"
                style={{ bottom: `${chickenBottom + 46}px` }}
              >
                <div className="relative flex items-start justify-center">
                  <motion.div
                    animate={{ opacity: [0.1, 0.55, 0.35, 0] }}
                    transition={{ duration: 1.2 }}
                    className="absolute top-[72px] h-40 w-20 bg-[linear-gradient(180deg,rgba(125,211,252,0.75),rgba(56,189,248,0.35),transparent_78%)] blur-[1px]"
                    style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }}
                  />
                  <img
                    src="/images/ufo.png"
                    alt="UFO"
                    className="relative h-28 w-28 object-contain drop-shadow-[0_0_24px_rgba(56,189,248,0.35)]"
                  />
                </div>
              </motion.div>
            )}

            {showDeathOverlay && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/82 backdrop-blur-sm">
                <div className="rounded-[1.8rem] border border-rose-500/20 bg-rose-500/10 px-10 py-8 text-center shadow-[0_0_60px_rgba(244,63,94,0.2)]">
                  <p className="text-5xl font-black tracking-[0.18em] text-rose-300">YOU DIED</p>
                  <p className="mt-3 text-sm text-white/65">Press Start Round to reset the road.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
