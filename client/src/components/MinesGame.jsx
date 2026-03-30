import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";
import { GameLayout } from "./GameLayout.jsx";

function Tile({ state, onClick, disabled, shake }) {
  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.1, y: disabled ? 0 : -4 }}
      whileTap={{ scale: disabled ? 1 : 0.9 }}
      animate={shake ? { x: [0, -2, 2, -2, 2, 0] } : { rotateY: state !== "hidden" ? 180 : 0 }}
      transition={{ duration: 0.35 }}
      onClick={disabled ? undefined : onClick}
      className={`w-16 h-16 rounded-xl flex items-center justify-center cursor-pointer text-sm font-black select-none
        ${state === "hidden" ? "bg-gray-700 text-white/80" : ""}
        ${state === "safe" ? "bg-green-500 shadow-lg shadow-green-500/30 text-white" : ""}
        ${state === "mine" ? "bg-red-500 shadow-lg shadow-red-500/30 text-white" : ""}
        ${disabled ? "opacity-80 cursor-not-allowed" : ""}`}
    >
      {state === "mine" ? "💣" : state === "safe" ? "◆" : ""}
    </motion.div>
  );
}

export function MinesGame({ token, user, onBalanceChange }) {
  const [betAmount, setBetAmount] = useState(25);
  const [betInput, setBetInput] = useState("25");
  const [minesCount, setMinesCount] = useState(3);
  const [clientSeed, setClientSeed] = useState(user.clientSeed || "donutdrop-default");
  const [activeGame, setActiveGame] = useState(null);
  const [settledGame, setSettledGame] = useState(null);
  const [feedback, setFeedback] = useState({ text: "", tone: "neutral" });
  const [loading, setLoading] = useState(false);
  const clickCountRef = useRef(0);

  const tiles = useMemo(() => Array.from({ length: 25 }, (_, index) => index), []);
  const revealedTiles = activeGame?.revealedTiles || settledGame?.revealedTiles || [];
  const minePositions = settledGame?.minePositions || [];
  const currentMultiplier = activeGame?.multiplier || settledGame?.multiplier || 1;
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

  async function handleTileClick(tileIndex) {
    if (!activeGame || loading || activeGame.revealedTiles.includes(tileIndex)) {
      return;
    }

    setLoading(true);

    try {
      const data = await api.clickMines(token, {
        gameId: activeGame.gameId,
        tileIndex
      });

      clickCountRef.current += 1;
      if (clickCountRef.current % 2 === 0) {
        playTntSizzle();
      }

      if (data.result === "mine") {
        setActiveGame(null);
        setSettledGame(data.game);
        setFeedback({ text: "Mine hit. Round lost and seeds revealed below.", tone: "loss" });
      } else {
        setActiveGame(data.game);
        setFeedback({
          text: `Safe tile. Multiplier climbed to ${data.multiplier.toFixed(2)}x.`,
          tone: "win"
        });
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
      onBalanceChange(data.balance);
      setFeedback({ text: `Cashed out for $${data.payout.toFixed(2)}.`, tone: "win" });
    } catch (error) {
      setFeedback({ text: error.message, tone: "loss" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <GameLayout
      eyebrow="Mines"
      title="Thread the grid, dodge the TNT"
      subtitle="The flagship board now runs inside the same high-end table shell, with brighter multiplier feedback, cleaner controls, and a more alive reveal board."
      accent="from-orange-500/12 via-emerald-500/5 to-purple-500/10"
      controls={
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-amber-200/70">Mines Bet</p>
            <h3 className="mt-2 text-3xl font-black text-white">Place your round</h3>
          </div>

          <div className="space-y-3">
              <label className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-white/70 block">
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
              <label className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-white/70 block">
                Mines
                <div className="mt-2 flex items-center justify-between text-sm text-white">
                  <span>Number of Mines</span>
                  <span>{minesCount}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={minesCount}
                  onChange={(event) => setMinesCount(Number(event.target.value))}
                  className="mt-4 w-full accent-emerald-400"
                />
                <div className="mt-2 flex items-center justify-between text-xs text-white/40">
                  <span>3</span>
                  <span>10</span>
                </div>
              </label>
              <label className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-white/70 block">
                Client Seed
                <input
                  value={clientSeed}
                  onChange={(event) => setClientSeed(event.target.value)}
                  className="casino-input mt-2"
                />
              </label>
          </div>

          <div className="flex gap-3">
            <button
                type="button"
                onClick={handleStart}
                disabled={loading || Boolean(activeGame)}
                className="neon-button disabled:opacity-50"
              >
                {loading && !activeGame ? "Starting..." : "Start round"}
            </button>
            <motion.button
                type="button"
                onClick={handleCashout}
                disabled={loading || !activeGame}
                animate={activeGame ? { boxShadow: ["0 0 0 rgba(34,197,94,0.0)", "0 0 24px rgba(34,197,94,0.24)", "0 0 0 rgba(34,197,94,0.0)"] } : {}}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-100 disabled:opacity-50"
              >
                Cash out
            </motion.button>
          </div>

          <div className="rounded-[1.6rem] border border-white/8 bg-black/20 p-4">
            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
                <p className="text-sm text-white/50">Current Multiplier</p>
                <p className="mt-2 text-xl font-semibold text-white">{currentMultiplier.toFixed(2)}x</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
                <p className="text-sm text-white/50">Payout Preview</p>
                <p className="mt-2 text-xl font-semibold text-mint">${payoutPreview}</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
                <p className="text-sm text-white/50">Server Seed Hash</p>
                <p className="mt-2 break-all font-mono text-xs text-white/80">
                  {activeGame?.serverSeedHash || settledGame?.serverSeedHash || "Awaiting round"}
                </p>
              </div>
            </div>
          </div>

          {feedback.text && (
            <motion.p
                key={feedback.text}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-2xl px-4 py-3 text-sm ${
                  feedback.tone === "win"
                    ? "border border-emerald-400/15 bg-emerald-500/10 text-emerald-200 shadow-[0_0_30px_rgba(16,185,129,0.15)]"
                    : feedback.tone === "loss"
                      ? "border border-rose-400/15 bg-rose-500/10 text-rose-200"
                      : "border border-white/8 bg-white/5 text-white/70"
                }`}
            >
                {feedback.text}
            </motion.p>
          )}
        </div>
      }
      main={
        <div className="rounded-[1.75rem] border border-amber-500/10 bg-black/25 p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/40">Active Board</p>
              <p className="mt-1 text-sm text-white/65">
                {activeGame ? "Safe clicks build multiplier." : "Start a round to unlock the grid."}
              </p>
            </div>
            <div className="rounded-full border border-amber-400/15 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">
              {minesCount} mines
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3">
            {tiles.map((tile) => {
              const isRevealed = revealedTiles.includes(tile);
              const isMine = minePositions.includes(tile);
              const state = isMine ? "mine" : isRevealed ? "safe" : "hidden";

              return (
                <Tile
                  key={tile}
                  onClick={() => handleTileClick(tile)}
                  state={state}
                  disabled={!activeGame || loading}
                  shake={feedback.tone === "loss" && settledGame?.active === false}
                />
              );
            })}
          </div>
        </div>
      }
    />
  );
}
