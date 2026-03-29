import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { FairnessCard } from "./FairnessCard.jsx";

export function MinesGame({ token, user, onBalanceChange }) {
  const [betAmount, setBetAmount] = useState(25);
  const [minesCount, setMinesCount] = useState(3);
  const [clientSeed, setClientSeed] = useState(user.clientSeed || "donutdrop-default");
  const [activeGame, setActiveGame] = useState(null);
  const [settledGame, setSettledGame] = useState(null);
  const [feedback, setFeedback] = useState({ text: "", tone: "neutral" });
  const [loading, setLoading] = useState(false);

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

    try {
      const data = await api.startMines(token, {
        bet: betAmount,
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
    <div className="space-y-5">
      <section className="glass-panel rounded-3xl p-5">
        <div className="grid gap-4 lg:grid-cols-[1.1fr,1fr]">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">Mines</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Thread the grid, avoid the traps</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
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
                Mines
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={minesCount}
                  onChange={(event) => setMinesCount(Number(event.target.value))}
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
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleStart}
                disabled={loading || Boolean(activeGame)}
                className="rounded-2xl bg-accent px-5 py-3 font-semibold text-black disabled:opacity-50"
              >
                {loading && !activeGame ? "Starting..." : "Start round"}
              </button>
              <button
                type="button"
                onClick={handleCashout}
                disabled={loading || !activeGame}
                className="rounded-2xl bg-white/10 px-5 py-3 font-semibold text-white disabled:opacity-50"
              >
                Cash out
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-white/50">Current Multiplier</p>
                <p className="mt-2 text-xl font-semibold text-white">{currentMultiplier.toFixed(2)}x</p>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-white/50">Payout Preview</p>
                <p className="mt-2 text-xl font-semibold text-mint">${payoutPreview}</p>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <p className="text-sm text-white/50">Server Seed Hash</p>
                <p className="mt-2 break-all font-mono text-xs text-white/80">
                  {activeGame?.serverSeedHash || settledGame?.serverSeedHash || "Awaiting round"}
                </p>
              </div>
            </div>

            {feedback.text && (
              <motion.p
                key={feedback.text}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
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

          <div className="grid grid-cols-5 gap-3">
            {tiles.map((tile) => {
              const isRevealed = revealedTiles.includes(tile);
              const isMine = minePositions.includes(tile);

              return (
                <motion.button
                  key={tile}
                  whileHover={{ scale: activeGame ? 1.04 : 1 }}
                  whileTap={{ scale: activeGame ? 0.96 : 1 }}
                  animate={
                    feedback.tone === "loss" && settledGame?.active === false
                      ? { x: [0, -2, 2, -2, 2, 0] }
                      : { rotateY: isRevealed || isMine ? 180 : 0 }
                  }
                  transition={{ duration: 0.35 }}
                  type="button"
                  onClick={() => handleTileClick(tile)}
                  disabled={!activeGame || loading}
                  className={`aspect-square rounded-2xl border text-lg font-semibold transition ${
                    isMine
                      ? "border-rose-500/50 bg-rose-500/20 text-rose-100"
                      : isRevealed
                        ? "border-emerald-500/40 bg-emerald-500/20 text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.12)]"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-accent/50"
                  } disabled:cursor-not-allowed disabled:opacity-90`}
                >
                  {isMine ? "X" : isRevealed ? "O" : "?"}
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      <FairnessCard
        title="Mines settlement"
        data={
          settledGame
            ? {
                serverSeedHash: settledGame.serverSeedHash,
                serverSeed: settledGame.serverSeed,
                clientSeed: settledGame.clientSeed,
                nonce: settledGame.nonce,
                mines: settledGame.minePositions.join(", ")
              }
            : null
        }
      />
    </div>
  );
}
