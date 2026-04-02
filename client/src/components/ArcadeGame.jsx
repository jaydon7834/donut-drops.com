import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";
import { createAppSocket } from "../lib/socket.js";
import { triggerGameEffect } from "../lib/gameEffects.js";
import { GameLayout } from "./GameLayout.jsx";

const caseRewards = [
  {
    label: "Dirt",
    rarity: "common",
    image: "/images/case-dirt.png",
    accent: "from-amber-700/60 to-stone-300/40"
  },
  {
    label: "Gilded",
    rarity: "rare",
    image: "/images/case-gilded.png",
    accent: "from-yellow-500/60 to-neutral-700/60"
  },
  {
    label: "Netherite",
    rarity: "red",
    image: "/images/case-netherite.png",
    accent: "from-rose-500/65 to-red-950/70"
  },
  {
    label: "Elytra",
    rarity: "legendary",
    image: "/images/case-elytra.png",
    accent: "from-violet-400/60 to-sky-200/40"
  }
];

const SPIN_CARD_WIDTH = 196;
const SPIN_REPEAT_COUNT = 8;

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
    subtitle: "Create a battle, wait for another player, and let the higher drop take the pot.",
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

function getRewardIndex(label) {
  return Math.max(
    0,
    caseRewards.findIndex((reward) => reward.label === label)
  );
}

export function ArcadeGame({ token, gameType, user, onBalanceChange, onBack }) {
  const meta = gameCopy[gameType];
  const hideGameCopy = gameType === "cases" || gameType === "case-battles";
  const [bet, setBet] = useState(0);
  const [betInput, setBetInput] = useState("");
  const [optionValue, setOptionValue] = useState(gameType === "roulette" ? "red" : 2);
  const [clientSeed, setClientSeed] = useState(user.clientSeed || "donutdrop-default");
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [spinSequence, setSpinSequence] = useState(0);
  const [caseSpinOffset, setCaseSpinOffset] = useState(0);
  const [openBattles, setOpenBattles] = useState([]);
  const [battleMessage, setBattleMessage] = useState("");
  const [waitingBattleId, setWaitingBattleId] = useState("");
  const [activeBattle, setActiveBattle] = useState(null);
  const caseBattleMinimum = 5_000_000;
  const caseBattleBet = parseBetInput(betInput);
  const caseBattleNeedsMinimum = gameType === "case-battles" && caseBattleBet < caseBattleMinimum;
  const caseBattleNeedsBalance = gameType === "case-battles" && caseBattleBet > Number(user?.balance || 0);
  const caseBattleBlocked = caseBattleNeedsMinimum || caseBattleNeedsBalance;

  function applyResolvedBattle(payload) {
    const self = payload?.players?.find((entry) => entry.id === user.id);
    const enemy = payload?.players?.find((entry) => entry.id !== user.id);

    setWaitingBattleId("");
    setActiveBattle({
      phase: "resolved",
      battleId: payload?.battleId || "",
      bet: payload?.bet || 0,
      pot: payload?.pot || 0,
      winnerId: payload?.winnerId || "",
      players: payload?.players || []
    });
    setResult({
      title: payload?.title || "Battle settled",
      bet: payload?.bet || parseBetInput(betInput),
      payout: self?.payout || 0,
      multiplier:
        payload?.bet && self?.payout ? Number((self.payout / payload.bet).toFixed(2)) : 0,
      details: {
        yourDrop: self?.reward?.label || "Unknown",
        yourRarity: self?.reward?.rarity || "unknown",
        opponentDrop: enemy?.reward?.label || "Unknown",
        opponentRarity: enemy?.reward?.rarity || "unknown",
        image: self?.reward?.image || "",
        pot: `$${Number(payload?.pot || 0).toFixed(2)}`
      }
    });
    onBalanceChange(payload?.balance || user.balance);
    setBattleMessage(
      payload?.winnerId === user.id
        ? "Another player joined and you won the battle."
        : payload?.winnerId
          ? "Another player joined and took the pot."
          : "Battle pushed. Both players got their stake back."
    );
  }

  function syncWaitingBattle(battles) {
    if (gameType !== "case-battles") {
      return;
    }

    const ownBattle = (battles || []).find((battle) => battle.host?.id === user.id);

    if (ownBattle) {
      setWaitingBattleId(ownBattle.id);
      setActiveBattle((current) => {
        if (current?.phase === "opening" || current?.phase === "resolved") {
          return current;
        }

        return {
          phase: "waiting",
          battleId: ownBattle.id,
          bet: ownBattle.bet,
          pot: Number(ownBattle.bet || 0) * 2,
          players: [{ id: user.id, username: user.username }]
        };
      });
      return;
    }

    setWaitingBattleId((currentId) => (currentId ? "" : currentId));
    setActiveBattle((current) => (current?.phase === "waiting" ? null : current));
  }

  useEffect(() => {
    setClientSeed(user.clientSeed || "donutdrop-default");
  }, [user.clientSeed]);

  useEffect(() => {
    if (gameType === "case-battles") {
      setBet(5_000_000);
      setBetInput("5m");
    }
  }, [gameType]);

  useEffect(() => {
    if (gameType !== "case-battles") {
      return undefined;
    }

    let cancelled = false;

    async function loadBattles() {
      try {
        const data = await api.getCaseBattles(token);
        if (!cancelled) {
          setOpenBattles(data.battles || []);
          syncWaitingBattle(data.battles || []);
        }
      } catch (error) {
        if (!cancelled) {
          setBattleMessage(error.message);
        }
      }
    }

    loadBattles();

    const socket = createAppSocket(user);

    socket.on("case-battles:update", (payload) => {
      if (!cancelled) {
        setOpenBattles(payload?.battles || []);
        syncWaitingBattle(payload?.battles || []);
      }
    });

    socket.on("case-battle:started", (payload) => {
      if (cancelled) {
        return;
      }

      setActiveBattle({
        phase: "opening",
        battleId: payload?.battleId || "",
        bet: payload?.bet || 0,
        pot: payload?.pot || 0,
        players: [
          payload?.host || { id: "", username: "Host" },
          payload?.opponent || { id: "", username: "Opponent" }
        ]
      });
      setBattleMessage("Battle started. Opening cases...");
    });

    socket.on("case-battle:resolved", (payload) => {
      if (cancelled) {
        return;
      }
      applyResolvedBattle(payload);
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [betInput, gameType, token, user, onBalanceChange]);

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
        const rewardIndex = Number.isInteger(data.game.details?.rewardIndex)
          ? data.game.details.rewardIndex
          : getRewardIndex(data.game.details?.reward);
        const nextSpin = spinSequence + 1;
        const targetOffset =
          ((SPIN_REPEAT_COUNT - 2) * caseRewards.length + rewardIndex) * SPIN_CARD_WIDTH;
        setSpinSequence(nextSpin);
        setCaseSpinOffset(targetOffset);
      }

      setResult(data.game);
      onBalanceChange(data.balance);
      triggerGameEffect(
        Number(data.game.payout || 0) > Number(data.game.bet || 0)
          ? Number(data.game.payout || 0) >= Number(data.game.bet || 0) * 3
            ? "big-win"
            : "win"
          : "loss"
      );
      setFeedback(data.game.payout > data.game.bet ? "Win locked in." : "Round settled.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshCaseBattles() {
    try {
      const data = await api.getCaseBattles(token);
      setOpenBattles(data.battles || []);
    } catch (error) {
      setBattleMessage(error.message);
    }
  }

  async function handleCreateBattle() {
    setLoading(true);
    setBattleMessage("");

    try {
      const data = await api.createCaseBattle(token, {
        bet: parseBetInput(betInput)
      });
      setWaitingBattleId(data.battle.id);
      setActiveBattle({
        phase: "waiting",
        battleId: data.battle.id,
        bet: data.battle.bet,
        pot: Number(data.battle.bet || 0) * 2,
        players: [{ id: user.id, username: user.username }]
      });
      onBalanceChange({ balance: data.balance, refresh: false });
      setBattleMessage("Battle created. Waiting for another player to join.");
      setOpenBattles((current) => {
        const next = [...current.filter((battle) => battle.id !== data.battle.id), data.battle];
        return next.sort((a, b) => b.createdAt - a.createdAt);
      });
    } catch (error) {
      setBattleMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinBattle(battleId) {
    setLoading(true);
    setBattleMessage("");

    try {
      const data = await api.joinCaseBattle(token, battleId, {
        clientSeed
      });
      setOpenBattles((current) => current.filter((battle) => battle.id !== battleId));
      setActiveBattle({
        phase: "opening",
        battleId,
        bet: data.battle.bet,
        pot: data.battle.pot,
        players: [data.battle.host, data.battle.opponent]
      });
      onBalanceChange({ balance: data.balance, refresh: false });
      setBattleMessage("You joined the battle. Opening cases...");
      if (data.resolvedBattle) {
        window.setTimeout(() => applyResolvedBattle(data.resolvedBattle), 1400);
      }
    } catch (error) {
      setBattleMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelBattle() {
    if (!waitingBattleId) {
      return;
    }

    setLoading(true);
    setBattleMessage("");

    try {
      const data = await api.cancelCaseBattle(token, waitingBattleId);
      setWaitingBattleId("");
      setActiveBattle(null);
      onBalanceChange({ balance: data.balance, refresh: false });
      setOpenBattles((current) => current.filter((battle) => battle.id !== waitingBattleId));
      setBattleMessage("Battle canceled.");
    } catch (error) {
      setBattleMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCallBot() {
    if (!waitingBattleId) {
      return;
    }

    setLoading(true);
    setBattleMessage("");

    try {
      const data = await api.callCaseBattleBot(token, waitingBattleId, { clientSeed });
      setActiveBattle({
        phase: "opening",
        battleId: waitingBattleId,
        bet: data.battle.bet,
        pot: data.battle.pot,
        players: [data.battle.host, data.battle.opponent]
      });
      setWaitingBattleId("");
      setBattleMessage("Bot called in. Opening cases...");
      onBalanceChange({ balance: data.balance, refresh: false });
      if (data.resolvedBattle) {
        window.setTimeout(() => applyResolvedBattle(data.resolvedBattle), 1400);
      }
    } catch (error) {
      setBattleMessage(error.message);
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
      eyebrow={hideGameCopy ? null : meta.title}
      title={hideGameCopy ? null : meta.title}
      subtitle={hideGameCopy ? null : meta.subtitle}
      accent="from-orange-500/10 via-purple-500/5 to-emerald-500/10"
      controls={
        <div className="space-y-4">
          {!hideGameCopy ? (
            <div className={`rounded-[1.8rem] p-5 ${meta.accent}`}>
              <p className="text-xs uppercase tracking-[0.35em] text-white/80">{meta.title}</p>
              <h2 className="mt-3 text-3xl font-black text-white">{meta.title}</h2>
              <p className="mt-3 max-w-sm text-sm leading-7 text-white/80">{meta.subtitle}</p>
            </div>
          ) : null}

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
              <p className="mt-2 text-xs text-white/40">
                {gameType === "case-battles"
                  ? "Case battles require at least 5m per player."
                  : "Supports 10k, 1m, 1b and more."}
              </p>
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

            {(gameType === "cases" || gameType === "case-battles") && null}

            {gameType !== "case-battles" ? (
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
            ) : (
              <div className="mt-5 space-y-3">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCreateBattle}
                    disabled={loading || Boolean(waitingBattleId) || caseBattleBlocked}
                    className="neon-button disabled:opacity-50"
                  >
                    {waitingBattleId ? "Waiting For Player..." : "Create Battle"}
                  </button>
                  <button
                    type="button"
                    onClick={refreshCaseBattles}
                    className="rounded-2xl border border-white/10 px-5 py-3 text-sm text-white/75 transition hover:border-white/25 hover:text-white"
                  >
                    Refresh Lobby
                  </button>
                </div>
                {waitingBattleId && (
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      type="button"
                      onClick={handleCancelBattle}
                      disabled={loading}
                      className="rounded-2xl border border-red-400/20 px-5 py-3 text-sm text-red-200 transition hover:border-red-300/40 hover:text-red-100 disabled:opacity-50"
                    >
                      Cancel Battle
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={onBack}
                  className="rounded-2xl border border-white/10 px-5 py-3 text-sm text-white/75 transition hover:border-white/25 hover:text-white"
                >
                  Back To Lobby
                </button>
              </div>
            )}

            {(feedback || battleMessage) && (
              <p className={`mt-4 text-sm ${battleMessage ? "text-amber-100" : "text-white/70"}`}>
                {battleMessage || feedback}
              </p>
            )}
            {gameType === "case-battles" && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
                <p>Minimum battle: 5m</p>
                <p className="mt-1">Your balance: ${Number(user?.balance || 0).toFixed(2)}</p>
                {caseBattleNeedsMinimum && (
                  <p className="mt-2 text-amber-200">Type at least 5m to create a battle.</p>
                )}
                {caseBattleNeedsBalance && (
                  <p className="mt-2 text-rose-200">You do not have enough balance to create this battle.</p>
                )}
              </div>
            )}
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
                  key={spinSequence}
                  initial={{ x: 0 }}
                  animate={{ x: -caseSpinOffset }}
                  transition={{ duration: 2.8, ease: [0.16, 1, 0.3, 1] }}
                  className="flex gap-4"
                  style={{
                    paddingLeft: "calc(50% - 90px)",
                    paddingRight: "calc(50% - 90px)"
                  }}
                >
                  {Array.from({ length: SPIN_REPEAT_COUNT }).flatMap((_, row) =>
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

          {gameType === "case-battles" && (
            <div className="space-y-5">
              {activeBattle && (
                <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-white/45">Battle Arena</p>
                      <h3 className="mt-2 text-2xl font-black text-white">
                        {activeBattle.phase === "waiting"
                          ? "Waiting For Challenger"
                          : activeBattle.phase === "opening"
                            ? "Opening Cases"
                            : "Battle Result"}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {activeBattle.phase === "waiting" && waitingBattleId && (
                        <div className="flex items-center gap-3">
                          <div className="rounded-full border border-orange-300/20 bg-orange-400/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-orange-100">
                            Waiting For Challenger
                          </div>
                          <button
                            type="button"
                            onClick={handleCallBot}
                            disabled={loading}
                            className="rounded-2xl bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-950 transition hover:scale-[1.02] disabled:opacity-50"
                          >
                            Call A Bot
                          </button>
                        </div>
                      )}
                      <div className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/60">
                        Pot ${Number(activeBattle.pot || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {(activeBattle.players || []).map((player) => {
                      const reward = player.reward;
                      const isWinner = activeBattle.phase === "resolved" && activeBattle.winnerId === player.id;

                      return (
                        <div
                          key={player.id || player.username}
                          className={`rounded-[1.5rem] border p-5 ${
                            isWinner
                              ? "border-emerald-300/35 bg-emerald-400/10"
                              : "border-white/10 bg-black/20"
                          }`}
                        >
                          <p className="text-sm font-semibold text-white">{player.username}</p>
                          <div className="mt-4 flex min-h-[180px] items-center justify-center rounded-[1.4rem] border border-white/8 bg-[#0f1119]">
                            {activeBattle.phase === "opening" ? (
                              <motion.div
                                animate={{ rotate: [0, 360], scale: [0.96, 1.03, 0.96] }}
                                transition={{ duration: 1, ease: "linear", repeat: Infinity }}
                                className="flex h-28 w-28 items-center justify-center"
                              >
                                <img
                                  src="/images/case-netherite.png"
                                  alt="Battle case"
                                  className="h-20 w-20 object-contain opacity-80"
                                />
                              </motion.div>
                            ) : reward ? (
                              <div className="text-center">
                                <img
                                  src={reward.image}
                                  alt={reward.label}
                                  className="mx-auto h-24 w-24 object-contain"
                                />
                                <p className="mt-3 text-xs font-black uppercase tracking-[0.24em] text-white/60">
                                  {reward.rarity}
                                </p>
                                <p className="mt-1 text-xl font-black text-white">{reward.label}</p>
                                <p className="mt-2 text-sm text-emerald-200">{reward.multiplier.toFixed(2)}x</p>
                              </div>
                            ) : (
                              <p className="text-sm text-white/45">Waiting...</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-white/45">Battle Lobby</p>
                  <h3 className="mt-2 text-2xl font-black text-white">Open Battles</h3>
                </div>
                <div className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/60">
                  {openBattles.length} waiting
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {openBattles.length ? (
                  openBattles.map((battle) => (
                    <div
                      key={battle.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{battle.host.username}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                          Bet ${Number(battle.bet || 0).toFixed(2)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleJoinBattle(battle.id)}
                        disabled={loading || battle.host.id === user.id}
                        className="rounded-2xl bg-white px-4 py-2 text-sm font-black text-slate-900 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {battle.host.id === user.id ? "Your Battle" : "Join"}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/15 px-4 py-6 text-sm text-white/55">
                    No battle is waiting right now. Create one and the server will hold the room until another player joins.
                  </div>
                )}
              </div>
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
                    {key === "image" && value ? (
                      <img
                        src={String(value)}
                        alt={result.details?.reward || result.details?.yourDrop || "Case reward"}
                        className="mt-3 h-16 w-16 object-contain"
                      />
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
