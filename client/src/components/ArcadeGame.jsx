import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";
import { GameLayout } from "./GameLayout.jsx";

const caseRewards = [
  { label: "Dirt", rarity: "common", image: "/images/case-dirt.png", accent: "from-amber-700/60 to-stone-300/40" },
  { label: "Gilded", rarity: "rare", image: "/images/case-gilded.png", accent: "from-yellow-500/60 to-neutral-700/60" },
  { label: "Netherite", rarity: "red", image: "/images/case-netherite.png", accent: "from-rose-500/65 to-red-950/70" },
  { label: "Elytra", rarity: "legendary", image: "/images/case-elytra.png", accent: "from-violet-400/60 to-sky-200/40" }
];

const gameCopy = {
  blackjack: {
    title: "Blackjack",
    subtitle: "Quick duel against the dealer with instant resolution.",
    accent: "bg-gradient-to-br from-orange-700/70 to-amber-400/60",
    optionLabel: "Table"
  },
  roulette: {
    title: "Roulette",
    subtitle: "Pick a color and let the wheel lock the pocket.",
    accent: "bg-gradient-to-br from-fuchsia-700/70 to-amber-300/60",
    optionLabel: "Color"
  },
  limbo: {
    title: "Limbo",
    subtitle: "Set your target multiplier and pray the crash lands above it.",
    accent: "bg-gradient-to-br from-amber-700/70 to-yellow-300/60",
    optionLabel: "Target"
  },
  plinko: {
    title: "Plinko",
    subtitle: "Drop the ball and chase a high bucket multiplier.",
    accent: "bg-gradient-to-br from-cyan-700/70 to-sky-300/60",
    optionLabel: "Risk"
  },
  cases: {
    title: "Cases",
    subtitle: "Open a case and hope the drop table spikes upward.",
    accent: "bg-gradient-to-br from-indigo-700/70 to-cyan-300/60",
    optionLabel: "Case"
  },
  "case-battles": {
    title: "Case Battles",
    subtitle: "Open against a ghost opponent and compare scores.",
    accent: "bg-gradient-to-br from-rose-700/70 to-orange-300/60",
    optionLabel: "Battle"
  },
  chicken: {
    title: "Chicken",
    subtitle: "Cross for more steps and a higher multiplier before disaster.",
    accent: "bg-gradient-to-br from-lime-700/70 to-yellow-300/60",
    optionLabel: "Lane"
  }
};

function getPayload(gameType, optionValue, clientSeed) {
  if (gameType === "roulette") {
    return { selection: optionValue, clientSeed };
  }

  if (gameType === "limbo") {
    return { targetMultiplier: optionValue, clientSeed };
  }

  return { clientSeed };
}

export function ArcadeGame({ token, gameType, user, onBalanceChange, onBack }) {
  const meta = gameCopy[gameType];
  const [bet, setBet] = useState(20);
  const [betInput, setBetInput] = useState("20");
  const [optionValue, setOptionValue] = useState(gameType === "roulette" ? "red" : 2);
  const [clientSeed, setClientSeed] = useState(user.clientSeed || "donutdrop-default");
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [caseSpinOffset, setCaseSpinOffset] = useState(0);

  async function handlePlay() {
    setLoading(true);
    setFeedback("");

    try {
      const data = await api.playInstant(token, {
        gameType,
        bet: parseBetInput(betInput),
        ...getPayload(gameType, optionValue, clientSeed)
      });

      if (gameType === "cases") {
        const rewardIndex = Math.max(
          0,
          caseRewards.findIndex((reward) => reward.label === data.game.details?.reward)
        );
        setCaseSpinOffset(1000 + rewardIndex * 220);
      }

      setResult(data.game);
      onBalanceChange(data.balance);
      setFeedback(data.game.payout > data.game.bet ? "Win locked in." : "Round settled.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleBetInputChange(value) {
    setBetInput(value);
    const parsed = parseBetInput(value);
    if (parsed > 0) {
      setBet(parsed);
    }
  }

  function adjustBet(multiplier) {
    const nextBet = Math.max(1, Math.round(parseBetInput(betInput || bet) * multiplier));
    setBet(nextBet);
    setBetInput(formatBetInput(nextBet));
  }

  return (
    <GameLayout
      eyebrow={meta.title}
      title={meta.title}
      subtitle={meta.subtitle}
      accent="from-orange-500/10 via-purple-500/5 to-emerald-500/10"
      controls={
        <div className="space-y-4">
          <div className={`rounded-[1.8rem] p-5 ${meta.accent}`}>
            <p className="text-xs uppercase tracking-[0.35em] text-white/80">{meta.title}</p>
            <h2 className="mt-3 text-3xl font-black text-white">{meta.title}</h2>
            <p className="mt-3 max-w-sm text-sm leading-7 text-white/80">{meta.subtitle}</p>
          </div>

          <div className="rounded-[1.8rem] bg-white/5 p-5">
            <label className="block text-sm text-white/70">
                Bet Amount
                <div className="mt-2 flex overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  <input
                    value={betInput}
                    onChange={(event) => handleBetInputChange(event.target.value)}
                    className="w-full bg-transparent px-4 py-3 text-white outline-none"
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

            <label className="mt-4 block text-sm text-white/70">
                Client Seed
                <input
                  value={clientSeed}
                  onChange={(event) => setClientSeed(event.target.value)}
                  className="casino-input mt-2"
                />
            </label>

            {gameType === "roulette" && (
              <label className="mt-4 block text-sm text-white/70">
                  {meta.optionLabel}
                  <select
                    value={optionValue}
                    onChange={(event) => setOptionValue(event.target.value)}
                    className="casino-input mt-2"
                  >
                    <option value="red">Red</option>
                    <option value="black">Black</option>
                    <option value="green">Green</option>
                  </select>
              </label>
            )}

            {gameType === "limbo" && (
              <label className="mt-4 block text-sm text-white/70">
                  {meta.optionLabel}
                  <input
                    type="range"
                    min="1.5"
                    max="8"
                    step="0.1"
                    value={optionValue}
                    onChange={(event) => setOptionValue(Number(event.target.value))}
                    className="mt-4 w-full accent-accent"
                  />
                  <p className="mt-2 text-white">{Number(optionValue).toFixed(1)}x</p>
              </label>
            )}

            {gameType === "cases" && (
              <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                <p className="text-sm text-white/70">Drops</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {caseRewards.map((reward) => (
                    <div
                      key={reward.label}
                      className={`rounded-2xl border border-white/10 bg-gradient-to-br ${reward.accent} p-3 text-center`}
                    >
                      <img
                        src={reward.image}
                        alt={reward.label}
                        className="mx-auto h-14 w-14 object-contain"
                      />
                      <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-white">
                        {reward.rarity}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">{reward.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                  type="button"
                  onClick={handlePlay}
                  disabled={loading}
                  className="neon-button disabled:opacity-50"
                >
                  {loading ? "Resolving..." : `Play ${meta.title}`}
              </button>
              <button
                  type="button"
                  onClick={onBack}
                  className="rounded-2xl border border-white/10 px-5 py-3 text-sm text-white/75 transition hover:border-white/25 hover:text-white"
                >
                  Back To Lobby
              </button>
            </div>

            {feedback && <p className="mt-4 text-sm text-white/70">{feedback}</p>}
          </div>
        </div>
      }
      main={
        <div className="space-y-5">
            {gameType === "cases" && (
              <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#0f1119] p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-white/45">Case Spinner</p>
                <div className="relative mt-4 overflow-hidden rounded-2xl border border-white/6 bg-black/20 py-6">
                  <div className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-[3px] -translate-x-1/2 bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)]" />
                  <motion.div
                    animate={{ x: -caseSpinOffset }}
                    transition={{ duration: 2.8, ease: [0.16, 1, 0.3, 1] }}
                    className="flex gap-4 px-[40%]"
                  >
                    {Array.from({ length: 7 }).flatMap((_, row) =>
                      caseRewards.map((reward, index) => (
                        <div
                          key={`${reward.label}-${row}-${index}`}
                          className={`flex w-[180px] shrink-0 flex-col items-center rounded-[1.6rem] border border-white/10 bg-gradient-to-br ${reward.accent} px-4 py-5`}
                        >
                          <img
                            src={reward.image}
                            alt={reward.label}
                            className="h-20 w-20 object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)]"
                          />
                          <p className="mt-3 text-[11px] font-black uppercase tracking-[0.28em] text-white/70">
                            {reward.rarity}
                          </p>
                          <p className="mt-1 text-lg font-black text-white">{reward.label}</p>
                        </div>
                      ))
                    )}
                  </motion.div>
                </div>
              </div>
            )}

            <motion.div
              key={result?.title || "idle"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6"
            >
              <p className="text-xs uppercase tracking-[0.35em] text-white/45">Last Round</p>
              <h3 className="mt-3 text-3xl font-black text-white">{result?.title || "Waiting for action"}</h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-sm text-white/50">Bet</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    ${result?.bet?.toFixed?.(2) || Number(bet).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-sm text-white/50">Multiplier</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {result?.multiplier?.toFixed?.(2) || "0.00"}x
                  </p>
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <p className="text-sm text-white/50">Payout</p>
                  <p className="mt-2 text-xl font-semibold text-mint">
                    ${result?.payout?.toFixed?.(2) || "0.00"}
                  </p>
                </div>
              </div>

              {result?.details && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {Object.entries(result.details).map(([key, value]) => (
                    <div key={key} className="rounded-2xl bg-black/20 p-4 text-sm text-white/75">
                      <p className="text-white/45">{key}</p>
                      {key === "image" ? (
                        <img src={String(value)} alt={result.details?.reward || "Case reward"} className="mt-3 h-16 w-16 object-contain" />
                      ) : (
                        <p className="mt-2 text-lg font-semibold text-white">{String(value)}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
        </div>
      }
    />
  );
}
