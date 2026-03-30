import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";

function Tile({ state, onClick, disabled, shake }) {
  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.94 }}
      animate={shake ? { x: [0, -2, 2, -2, 2, 0] } : { rotateY: state !== "hidden" ? 180 : 0 }}
      transition={{ duration: 0.35 }}
      onClick={disabled ? undefined : onClick}
      className={`h-16 w-16 rounded-xl cursor-pointer flex items-center justify-center text-sm font-black select-none transition-all duration-200 sm:h-20 sm:w-20 xl:h-24 xl:w-24 2xl:h-28 2xl:w-28
        ${state === "hidden" ? "bg-[#1e293b] text-white/80 hover:bg-[#334155]" : ""}
        ${state === "safe" ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8)] text-white" : ""}
        ${state === "mine" ? "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] text-white" : ""}
        ${disabled ? "opacity-80 cursor-not-allowed" : ""}`}
    >
      {state === "mine" ? "💣" : state === "safe" ? "◆" : ""}
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
    <div className="flex w-full min-w-0 flex-col items-start gap-6 px-2 py-4 sm:px-4 xl:flex-row xl:items-stretch xl:px-6 xl:py-6">
      <div className="w-full shrink-0 rounded-[1.8rem] bg-[#131625] p-6 text-white xl:w-[260px]">
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
            />
            <div className="mt-2 flex items-center justify-between text-xs text-white/40">
              <span>1</span>
              <span>24</span>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 p-4">
            <p className="text-sm text-gray-400">Client Seed</p>
            <input
              value={clientSeed}
              onChange={(event) => setClientSeed(event.target.value)}
              className="mt-3 w-full rounded-[1rem] bg-[#0d111c] p-4 text-white outline-none"
            />
          </div>

          <div className="pt-40">
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

      <div className="min-w-0 flex-1 rounded-[1.8rem] bg-[#131625] p-4 shadow-[0_0_40px_rgba(0,0,0,0.2)] xl:min-h-[640px] xl:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-indigo-200/65">Mines Board</p>
            <p className="mt-2 text-lg text-white/70">Start a round to unlock the grid.</p>
          </div>
          <div className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-yellow-100">
            {minesCount} Mines
          </div>
        </div>

        <div className="mt-6 flex min-h-[520px] w-full items-center justify-center overflow-hidden rounded-2xl bg-[#0f172a] p-3 shadow-[0_0_40px_rgba(0,0,0,0.8)] xl:min-h-[640px] xl:p-6">
          <div className="flex w-full justify-center">
            <div className="grid shrink-0 grid-cols-5 gap-3 sm:gap-4">
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
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-300">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span className="font-semibold">Live</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/45">Current Multiplier</p>
            <p className="text-xl font-bold text-white">{currentMultiplier.toFixed(4)}x</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/45">Payout Preview</p>
            <p className="text-xl font-bold text-emerald-300">${payoutPreview}</p>
          </div>
        </div>

        {feedback.text && (
          <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            feedback.tone === "loss"
              ? "bg-rose-500/10 text-rose-300"
              : feedback.tone === "win"
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-white/5 text-white/70"
          }`}>
            {feedback.text}
          </div>
        )}
      </div>
    </div>
  );
}
