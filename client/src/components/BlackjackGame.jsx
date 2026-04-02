import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";
import { triggerGameEffect } from "../lib/gameEffects.js";

const CHIP_VALUES = [1_000, 1_000_000, 10_000_000, 100_000_000];

function Card({ card }) {
  if (card?.hidden) {
    return <div className="h-24 w-16 rounded-lg bg-slate-700 shadow-lg" />;
  }

  const isRed = card?.suit === "♥" || card?.suit === "♦";

  return (
    <motion.div
      initial={{ y: -16, opacity: 0, rotateY: -90 }}
      animate={{ y: 0, opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.28 }}
      className="flex h-24 w-16 flex-col justify-between rounded-lg bg-white p-2 shadow-[0_12px_25px_rgba(0,0,0,0.3)]"
    >
      <span className={`text-sm font-bold ${isRed ? "text-red-600" : "text-slate-900"}`}>{card.value}</span>
      <span className={`self-end text-xl ${isRed ? "text-red-600" : "text-slate-900"}`}>{card.suit}</span>
    </motion.div>
  );
}

export function BlackjackGame({ token, onBalanceChange, onBack }) {
  const [betAmount, setBetAmount] = useState(0);
  const [betInput, setBetInput] = useState("");
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
      const data = await api.startBlackjack(token, {
        bet: parseBetInput(betInput)
      });

      setGame(data.game);
      onBalanceChange(data.balance);
      setFeedback("Cards are live. Hit for another card or stand to settle.");
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleHit() {
    if (!game?.active) {
      return;
    }

    setLoading(true);

    try {
      const data = await api.hitBlackjack(token, { gameId: game.gameId });
      setGame(data.game);
      onBalanceChange(data.balance);
      if (data.game.result === "lose") {
        triggerGameEffect("loss");
      }
      setFeedback(
        data.game.result === "lose"
          ? "Bust. Dealer scoops the hand."
          : "Card added. You are still live."
      );
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStand() {
    if (!game?.active) {
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 650));
      const data = await api.standBlackjack(token, { gameId: game.gameId });
      setGame(data.game);
      onBalanceChange(data.balance);
      triggerGameEffect(
        data.game.result === "win"
          ? Number(data.game.payout || 0) >= Number(data.game.bet || 0) * 3
            ? "big-win"
            : "win"
          : data.game.result === "lose"
            ? "loss"
            : "win"
      );

      setFeedback(
        data.game.result === "win"
          ? `You won $${data.game.payout.toFixed(2)}.`
          : data.game.result === "draw"
          ? "Push. Bet returned."
          : "Dealer wins the hand."
      );
    } catch (error) {
      setFeedback(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 p-4 xl:flex-row xl:items-stretch xl:p-6">
      <div className="w-full shrink-0 rounded-2xl bg-[#0f172a] p-5 text-white xl:w-[220px]">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400">Bet Amount</p>
            <div className="mt-2 flex overflow-hidden rounded-lg bg-[#1e293b]">
              <input
                value={betInput}
                onChange={(event) => handleBetInputChange(event.target.value)}
                className="w-full bg-transparent p-3 text-white outline-none"
                placeholder="1m"
                disabled={Boolean(game?.active)}
              />
              <div className="flex items-center gap-1 pr-2">
                <button type="button" onClick={() => adjustBet(0.5)} className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-white" disabled={Boolean(game?.active)}>
                  1/2
                </button>
                <button type="button" onClick={() => adjustBet(2)} className="rounded-lg bg-white/10 px-2 py-1 text-xs font-semibold text-white" disabled={Boolean(game?.active)}>
                  2x
                </button>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400">Quick Chips</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {CHIP_VALUES.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    const nextBet = parseBetInput(betInput || betAmount) + value;
                    setBetAmount(nextBet);
                    setBetInput(formatBetInput(nextBet));
                  }}
                  disabled={Boolean(game?.active)}
                  className="rounded-full border border-white/10 bg-white/5 px-2 py-3 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
                >
                  {formatBetInput(value)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#1e293b] p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Player</p>
              <p className="mt-2 text-xl font-bold text-white">{game?.playerValue ?? "--"}</p>
            </div>
            <div className="rounded-xl bg-[#1e293b] p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Dealer</p>
              <p className="mt-2 text-xl font-bold text-white">{game?.dealerValue ?? "--"}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStart}
            disabled={loading || Boolean(game?.active)}
            className="w-full rounded-xl bg-orange-500 p-3 font-bold text-slate-950 transition hover:bg-orange-400 disabled:opacity-50"
          >
            {loading && !game?.active ? "Dealing..." : "Start Hand"}
          </button>

          <div className="flex gap-4 mt-2">
            <button
              type="button"
              onClick={handleHit}
              disabled={loading || !game?.active}
              className="w-full rounded-xl bg-green-500 px-6 py-3 font-bold text-slate-950 disabled:opacity-50"
            >
              Hit
            </button>

            <button
              type="button"
              onClick={handleStand}
              disabled={loading || !game?.active}
              className="w-full rounded-xl bg-red-500 px-6 py-3 font-bold text-white disabled:opacity-50"
            >
              Stand
            </button>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-white/25 hover:text-white"
          >
            Back To Lobby
          </button>

          {feedback && (
            <motion.p
              key={feedback}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, x: feedback.includes("wins") || feedback.includes("Bust") ? [0, -3, 3, 0] : 0 }}
              className="text-sm text-white/70"
            >
              {feedback}
            </motion.p>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 rounded-2xl bg-[#0b0f1a] p-6">
        <div className="flex h-full w-full flex-col justify-between overflow-hidden rounded-[1.8rem] border border-white/6 bg-[#0d0f18] p-6">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center gap-3">
              <img
                src="/images/alien-dealer.png"
                alt="Alien dealer"
                className="h-16 w-16 object-contain drop-shadow-[0_0_18px_rgba(163,230,53,0.25)]"
              />
              <p className="text-center text-gray-400">Alien Dealer</p>
            </div>
            <div className="mt-4 min-h-[6rem] flex justify-center gap-2">
              {(game?.dealer || []).length ? (
                (game?.dealer || []).map((card, index) => (
                  <Card key={`dealer-${index}-${card.hidden ? "hidden" : `${card.value}${card.suit}`}`} card={card} />
                ))
              ) : (
                <p className="self-center text-center text-white/45">No cards dealt</p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 py-6">
            <div className="min-w-[14rem] bg-[linear-gradient(90deg,transparent,rgba(99,102,241,0.15),transparent)] px-6 py-2 text-center text-xs font-black uppercase tracking-[0.28em] text-indigo-200/75">
              Blackjack Pays 3:2
            </div>
            <div className="min-w-[12rem] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] px-6 py-2 text-center text-[11px] font-black uppercase tracking-[0.24em] text-white/45">
              Insurance Pays 2:1
            </div>
          </div>

          <div className="flex flex-col items-center">
            <p className="text-gray-400 text-center">You</p>
            <div className="mt-4 min-h-[6rem] flex justify-center gap-2">
              {(game?.player || []).length ? (
                (game?.player || []).map((card, index) => (
                  <Card key={`player-${index}-${card.value}${card.suit}`} card={card} />
                ))
              ) : (
                <p className="self-center text-center text-white/45">No cards dealt</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
