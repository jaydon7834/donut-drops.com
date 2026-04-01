import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";
import { triggerGameEffect } from "../lib/gameEffects.js";

const SAFE_TILE_IMAGE = "/images/mines-safe-emerald.png";
const MINE_TILE_IMAGE = "/images/mines-mine-tnt.png";

function combination(n, k) {
  if (k > n) {
    return 0;
  }

  if (k === 0 || k === n) {
    return 1;
  }

  let result = 1;

  for (let i = 1; i <= k; i += 1) {
    result = (result * (n - (k - i))) / i;
  }

  return result;
}

function calculateMultiplier(mines, picks) {
  const totalTiles = 25;
  const houseEdge = 0.99;
  const numerator = combination(totalTiles, picks);
  const denominator = combination(totalTiles - mines, picks);
  return Number(((numerator / denominator) * houseEdge).toFixed(4));
}

function Tile({ state, onClick, disabled, shake, spark }) {
  return (
    <motion.div
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      animate={
        state === "safe"
          ? { scale: [1, 1.08, 1], boxShadow: ["0 0 0 rgba(0,255,136,0)", "0 0 8px #00ff88, 0 0 20px rgba(0,255,136,0.5)", "0 0 8px #00ff88, 0 0 20px rgba(0,255,136,0.5)"] }
          : shake
            ? { x: [0, -6, 6, -4, 4, 0] }
            : { scale: 1 }
      }
      transition={{ duration: state === "safe" ? 0.2 : 0.35, ease: "easeOut" }}
      onClick={disabled ? undefined : onClick}
      className={`tile relative h-12 w-12 cursor-pointer select-none rounded-[14px] border border-white/6 text-sm font-black transition-all duration-200 sm:h-14 sm:w-14 xl:h-16 xl:w-16 2xl:h-20 2xl:w-20
        flex items-center justify-center
        ${state === "hidden" ? "bg-[linear-gradient(145deg,#0f172a,#020617)] text-white/80 hover:border-cyan-300/20 hover:bg-[linear-gradient(145deg,#111d33,#030712)]" : ""}
        ${state === "safe" ? "safe border-emerald-300/45 bg-[linear-gradient(145deg,#0d1f1b,#03110c)] text-[#9fffd0]" : ""}
        ${state === "mine" ? "mine border-rose-300/35 bg-[linear-gradient(145deg,#231015,#090102)] text-white" : ""}
        ${disabled ? "cursor-not-allowed opacity-80" : ""}
        ${spark ? "overflow-visible" : ""}`}
      style={{
        borderRadius: 14,
        background:
          state === "hidden"
            ? "linear-gradient(145deg, #0f172a, #020617)"
            : undefined,
        boxShadow:
          state === "safe"
            ? "0 0 8px #00ff88, 0 0 20px rgba(0,255,136,0.5)"
            : state === "mine"
              ? "0 0 10px #ff3b3b, 0 0 25px rgba(255,59,59,0.6)"
              : undefined
      }}
    >
      {spark && state === "safe" && (
        <>
          {[0, 1, 2, 3].map((particle) => (
            <motion.span
              key={particle}
              initial={{ opacity: 0.95, scale: 0.7, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                scale: 0.15,
                x: [-10, 10, -12, 12][particle],
                y: [-12, -10, 10, 12][particle]
              }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5fffb2]"
            />
          ))}
        </>
      )}
      {state === "safe" && (
        <img
          src={SAFE_TILE_IMAGE}
          alt="Safe emerald"
          className="h-8 w-8 object-contain drop-shadow-[0_0_10px_rgba(16,255,136,0.45)] sm:h-9 sm:w-9 xl:h-10 xl:w-10 2xl:h-12 2xl:w-12"
        />
      )}
      {state === "mine" && (
        <img
          src={MINE_TILE_IMAGE}
          alt="TNT mine"
          className="h-8 w-8 object-contain drop-shadow-[0_0_12px_rgba(255,59,59,0.45)] sm:h-9 sm:w-9 xl:h-10 xl:w-10 2xl:h-12 2xl:w-12"
        />
      )}
    </motion.div>
  );
}

export function MinesGame({ token, user, onBalanceChange }) {
  const [betAmount, setBetAmount] = useState(25);
  const [betInput, setBetInput] = useState("25");
  const [minesCount, setMinesCount] = useState(1);
  const [clientSeed, setClientSeed] = useState(user.clientSeed || "donutdrop-default");
  const [activeGame, setActiveGame] = useState(null);
  const [settledGame, setSettledGame] = useState(null);
  const [feedback, setFeedback] = useState({ text: "", tone: "neutral" });
  const [loading, setLoading] = useState(false);
  const [sparkTile, setSparkTile] = useState(null);
  const [mineShake, setMineShake] = useState(null);
  const clickCountRef = useRef(0);

  const tiles = useMemo(() => Array.from({ length: 25 }, (_, index) => index), []);
  const revealedTiles = activeGame?.revealedTiles || settledGame?.revealedTiles || [];
  const minePositions = settledGame?.minePositions || [];
  const currentMultiplier = activeGame?.multiplier || settledGame?.multiplier || 1;
  const safePicks = revealedTiles.length - minePositions.length;
  const tilesRemaining = 25 - revealedTiles.length;
  const nextMultiplier = activeGame
    ? calculateMultiplier(activeGame.mines, activeGame.revealedTiles.length + 1)
    : null;
  const estimatedProfit = activeGame
    ? Math.max(activeGame.bet * activeGame.multiplier - activeGame.bet, 0).toFixed(2)
    : settledGame?.payout
    ? Math.max(settledGame.payout - settledGame.bet, 0).toFixed(2)
    : "0.00";
  const payoutPreview = activeGame
    ? (activeGame.bet * activeGame.multiplier).toFixed(2)
    : settledGame?.payout?.toFixed?.(2) || "0.00";

  async function handleStart() {
    setLoading(true);
    setFeedback({ text: "", tone: "neutral" });
    setSettledGame(null);
    clickCountRef.current = 0;

    try {
      const data = await api.startMines(token, {
        bet: parseBetInput(betInput),
        mines: minesCount,
        clientSeed
      });

      setActiveGame(data.game);
      onBalanceChange(data.balance);
      setFeedback({ text: "Round started. Pick safe tiles and cash out before you bust.", tone: "neutral" });
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

  function playTntSizzle() {
    if (typeof window === "undefined" || !window.AudioContext) {
      return;
    }

    const context = new window.AudioContext();
    const now = context.currentTime;
    const duration = 0.35;

    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(190, now);
    oscillator.frequency.exponentialRampToValueAtTime(120, now + duration);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(900, now);
    filter.Q.setValueAtTime(1.2, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.018, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + duration);

    oscillator.onended = () => {
      context.close().catch(() => {});
    };
  }

  function playSafeTick() {
    if (typeof window === "undefined" || !window.AudioContext) {
      return;
    }

    const context = new window.AudioContext();
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(620, now);
    oscillator.frequency.exponentialRampToValueAtTime(820, now + 0.06);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.02, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.13);
    oscillator.onended = () => {
      context.close().catch(() => {});
    };
  }

  function playMinePop() {
    if (typeof window === "undefined" || !window.AudioContext) {
      return;
    }

    const context = new window.AudioContext();
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(180, now);
    oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.18);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.03, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.2);
    oscillator.onended = () => {
      context.close().catch(() => {});
    };
  }

  async function handleTileClick(tileIndex) {
    if (!activeGame || loading || activeGame.revealedTiles.includes(tileIndex)) {
      return;
    }

    setLoading(true);
    setSparkTile(null);
    setMineShake(null);

    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 85);
      });

      const data = await api.clickMines(token, {
        gameId: activeGame.gameId,
        tileIndex
      });

      clickCountRef.current += 1;
      if (clickCountRef.current % 2 === 0) {
        playTntSizzle();
      }

      if (data.result === "mine") {
        playMinePop();
        triggerGameEffect("loss");
        setActiveGame(null);
        setSettledGame(data.game);
        setMineShake(tileIndex);
        setFeedback({ text: "Mine hit. Round lost and seeds revealed below.", tone: "loss" });
        window.setTimeout(() => setMineShake(null), 420);
      } else {
        playSafeTick();
        triggerGameEffect(data.multiplier >= 3 ? "big-win" : "win");
        setActiveGame(data.game);
        setSparkTile(tileIndex);
        setFeedback({
          text: `Safe tile. Multiplier climbed to ${data.multiplier.toFixed(2)}x.`,
          tone: "win"
        });
        window.setTimeout(() => setSparkTile(null), 260);
      }

      onBalanceChange(data.balance);
    } catch (error) {
      setFeedback({ text: error.message, tone: "loss" });
    } finally {
      setLoading(false);
    }
  }

  async function handleCashout() {
    if (!activeGame || loading) {
      return;
    }

    setLoading(true);

    try {
      const data = await api.cashoutMines(token, {
        gameId: activeGame.gameId
      });

      setActiveGame(null);
      setSettledGame({
        ...data.game,
        payout: data.payout
      });
      triggerGameEffect(data.payout >= data.game.bet * 3 ? "big-win" : "win");
      onBalanceChange(data.balance);
      setFeedback({ text: `Cashed out for $${data.payout.toFixed(2)}.`, tone: "win" });
    } catch (error) {
      setFeedback({ text: error.message, tone: "loss" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col items-start gap-6 px-2 py-4 sm:px-4 xl:flex-row xl:items-stretch xl:px-6 xl:py-6">
      <div className="w-full shrink-0 rounded-[1.8rem] bg-[#131625] p-5 text-white xl:w-[190px]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-indigo-200/65">Mines Bet</p>
            <h2 className="mt-3 text-3xl font-black text-white">Place your round</h2>
          </div>
          <div className="rounded-xl bg-white/5 px-3 py-2 text-white/45">⌁</div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-[1.5rem] border border-white/10 p-4">
            <p className="text-sm text-gray-400">Bet Amount</p>
            <div className="mt-2 flex overflow-hidden rounded-xl bg-[#0d111c]">
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
            <p className="mt-3 text-sm text-white/35">Supports 10k, 1m, 1b and more.</p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 p-4">
            <p className="text-sm text-gray-400">Mines</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-xl font-bold text-white">Number of Mines</p>
              <span className="text-xl font-bold text-white">{minesCount}</span>
            </div>
            <input
              type="range"
              min="1"
              max="24"
              value={minesCount}
              onChange={(event) => setMinesCount(Number(event.target.value))}
              className="mt-5 w-full accent-emerald-400"
              disabled={Boolean(activeGame)}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-white/40">
              <span>1</span>
              <span>24</span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[3, 5, 10, 15].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setMinesCount(preset)}
                  disabled={Boolean(activeGame)}
                  className={`rounded-lg px-2 py-2 text-xs font-bold transition ${
                    minesCount === preset
                      ? "bg-emerald-400 text-slate-950"
                      : "bg-white/8 text-white/80 hover:bg-white/12"
                  } disabled:opacity-50`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 p-4">
            <p className="text-sm text-gray-400">Client Seed</p>
            <input
              value={clientSeed}
              onChange={(event) => setClientSeed(event.target.value)}
              className="mt-3 w-full rounded-[1rem] bg-[#0d111c] p-4 text-white outline-none"
              disabled={Boolean(activeGame)}
            />
          </div>

          <div className="pt-24">
            <button
              type="button"
              onClick={handleStart}
              disabled={loading || Boolean(activeGame)}
              className="w-full rounded-xl bg-emerald-500 px-4 py-4 text-lg font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading && !activeGame ? "Starting..." : "Place Bet"}
            </button>

            {Boolean(activeGame) && (
              <button
                type="button"
                onClick={handleCashout}
                disabled={loading}
                className="mt-3 w-full rounded-xl bg-white/10 px-4 py-4 text-base font-bold text-white transition hover:bg-white/15 disabled:opacity-50"
              >
                Cash Out
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1 rounded-[1.8rem] bg-[#131625] p-4 shadow-[0_0_40px_rgba(0,0,0,0.2)] xl:min-h-[560px] xl:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-indigo-200/65">Mines Board</p>
            <p className="mt-2 text-lg text-white/70">Start a round to unlock the grid.</p>
          </div>
          <div className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-yellow-100">
            {minesCount} Mines
          </div>
        </div>

        <motion.div
          animate={feedback.tone === "loss" ? { x: [0, -5, 5, -4, 4, 0] } : { x: 0 }}
          transition={{ duration: 0.36, ease: "easeOut" }}
          className="mt-6 flex min-h-[360px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#0f172a] p-3 shadow-[0_0_40px_rgba(0,0,0,0.8)] xl:min-h-[440px] xl:p-4"
        >
          <div className="flex w-full justify-center">
            <div className="grid shrink-0 grid-cols-5 gap-2 sm:gap-2.5">
              {tiles.map((tile) => {
                const isRevealed = revealedTiles.includes(tile);
                const isMine = minePositions.includes(tile);
                const state =
                  settledGame && !activeGame
                    ? isMine
                      ? "mine"
                      : isRevealed
                        ? "safe"
                        : "hidden"
                    : isMine
                    ? "mine"
                    : isRevealed
                    ? "safe"
                    : "hidden";

                return (
                  <Tile
                    key={tile}
                    onClick={() => handleTileClick(tile)}
                    state={state}
                    disabled={!activeGame || loading}
                    shake={mineShake === tile || (feedback.tone === "loss" && settledGame?.active === false && isMine)}
                    spark={sparkTile === tile}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-4">
            <div className="flex items-center gap-2 text-emerald-300">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="font-semibold">Live</span>
            </div>
            <p className="mt-2 text-sm text-white/45">Safe Picks</p>
            <p className="text-2xl font-black text-white">{safePicks}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-white/45">Current Multiplier</p>
            <motion.p
              key={currentMultiplier}
              initial={{ opacity: 0.6, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="mt-2 text-2xl font-black text-white"
            >
              {currentMultiplier.toFixed(4)}x
            </motion.p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-white/45">Payout Preview</p>
            <p className="mt-2 text-2xl font-black text-emerald-300">${payoutPreview}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm text-white/45">Tiles Left</p>
            <p className="mt-2 text-2xl font-black text-white">{tilesRemaining}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Bet</p>
            <p className="mt-2 text-lg font-bold text-white">${activeGame?.bet ?? settledGame?.bet ?? parseBetInput(betInput)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Next Safe Tile</p>
            <p className="mt-2 text-lg font-bold text-cyan-200">{nextMultiplier ? `${nextMultiplier.toFixed(4)}x` : "--"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-white/40">Profit If Cashed</p>
            <p className="mt-2 text-lg font-bold text-emerald-300">${estimatedProfit}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-300">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="font-semibold">Live</span>
          </div>
          <p className="text-sm text-white/45">{activeGame ? "Round active" : settledGame ? "Round settled" : "Waiting for bet"}</p>
        </div>

        {feedback.text && (
          <motion.div
            key={feedback.text}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              x: feedback.tone === "loss" ? [0, -4, 4, -3, 0] : 0
            }}
            className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            feedback.tone === "loss"
              ? "bg-rose-500/10 text-rose-300"
              : feedback.tone === "win"
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-white/5 text-white/70"
          }`}
          >
            {feedback.text}
          </motion.div>
        )}
      </div>
    </div>
  );
}
