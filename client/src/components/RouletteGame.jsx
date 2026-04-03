import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";
import { triggerGameEffect } from "../lib/gameEffects.js";

const numbers = [
  0, 32, 15, 19, 4, 21, 2, 25,
  17, 34, 6, 27, 13, 36, 11, 30,
  8, 23, 10, 5, 24, 16, 33, 1,
  20, 14, 31, 9, 22, 18, 29, 7,
  28, 12, 35, 3, 26
];

const redNumbers = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18,
  19, 21, 23, 25, 27, 30, 32, 34, 36
]);

function getColor(number) {
  if (number === 0) {
    return "green";
  }

  return redNumbers.has(number) ? "red" : "black";
}

function RouletteWheel({ spin, resultIndex, spinning }) {
  const pocketAngle = 360 / numbers.length;
  const targetAngle = ((Number(resultIndex ?? 0) * pocketAngle) - 90) * (Math.PI / 180);
  const orbitRadius = 166;
  const ballX = Math.cos(targetAngle) * orbitRadius;
  const ballY = Math.sin(targetAngle) * orbitRadius;

  return (
    <div className="relative">
      <div className="absolute left-1/2 top-[-14px] z-20 h-0 w-0 -translate-x-1/2 border-l-[12px] border-r-[12px] border-b-[22px] border-l-transparent border-r-transparent border-b-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.65)]" />
      <motion.div
        animate={{ rotate: spin }}
        transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
        className="relative h-[400px] w-[400px] rounded-full border-8 border-slate-700 bg-[radial-gradient(circle_at_center,#1f2937_0%,#0b1120_58%,#020617_100%)] shadow-[0_0_45px_rgba(0,0,0,0.5)]"
      >
        {numbers.map((number, index) => {
          const angle = (360 / numbers.length) * index;
          const color = getColor(number);

          return (
            <div
              key={number}
              className="absolute left-1/2 top-1/2 h-1/2 w-[34px] origin-bottom -translate-x-1/2 -translate-y-full"
              style={{ transform: `translateX(-50%) translateY(-100%) rotate(${angle}deg)` }}
            >
              <div
                className={`flex h-full w-full flex-col items-center justify-start rounded-t-full pt-4 text-[11px] font-bold text-white ${
                  color === "red"
                    ? "bg-red-600"
                    : color === "black"
                    ? "bg-slate-900"
                    : "bg-emerald-500"
                }`}
              >
                <span style={{ transform: `rotate(${-angle}deg)` }}>{number}</span>
              </div>
            </div>
          );
        })}
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-slate-950 shadow-[0_0_30px_rgba(0,0,0,0.5)]" />
      </motion.div>
      <motion.div
        initial={false}
        animate={
          spinning
            ? {
                x: [0, 0, ballX * 0.45, ballX],
                y: [0, 0, ballY * 0.45, ballY],
                scale: [0.95, 1, 1, 1]
              }
            : {
                x: ballX,
                y: ballY,
                scale: 1
              }
        }
        transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-1/2 top-1/2 z-30 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80 bg-white shadow-[0_0_18px_rgba(255,255,255,0.85)]"
      />
    </div>
  );
}

export function RouletteGame({ token, user, onBalanceChange, onBack }) {
  const [betInput, setBetInput] = useState("");
  const [betAmount, setBetAmount] = useState(0);
  const [betType, setBetType] = useState("color");
  const [selection, setSelection] = useState("red");
  const [clientSeed, setClientSeed] = useState(user.clientSeed || "donutrain-default");
  const [spin, setSpin] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const SPIN_SETTLE_MS = 3000;

  const selectedNumbers = useMemo(() => {
    if (betType !== "number") {
      return new Set();
    }

    return new Set([Number(selection)]);
  }, [betType, selection]);

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

  async function handleSpin() {
    setLoading(true);
    setFeedback("");
    setSpinning(true);
    let delayedSettle = false;

    try {
      const data = await api.spinRoulette(token, {
        bet: parseBetInput(betInput),
        type: betType,
        value: betType === "number" ? Number(selection) : selection,
        clientSeed
      });

      const pocketAngle = 360 / numbers.length;
      const centerOffset = pocketAngle / 2;
      const normalizedCurrent = ((spin % 360) + 360) % 360;
      const targetRotation = (360 - (data.game.index * pocketAngle + centerOffset) + 360) % 360;
      const delta = (targetRotation - normalizedCurrent + 360) % 360;
      const finalAngle = spin + 360 * 5 + delta;

      setSpin(finalAngle);
      delayedSettle = true;
      window.setTimeout(() => {
        setResult(data.game);
        onBalanceChange(data.balance);
        triggerGameEffect(
          data.game.win
            ? Number(data.game.payout || 0) >= Number(data.game.bet || 0) * 3
              ? "big-win"
              : "win"
            : "loss"
        );
        setFeedback(
          data.game.win
            ? `Landed on ${data.game.number} ${data.game.color}. You won $${data.game.payout.toFixed(2)}.`
            : `Landed on ${data.game.number} ${data.game.color}. Better luck next spin.`
        );
        setSpinning(false);
      }, SPIN_SETTLE_MS);
    } catch (error) {
      setSpinning(false);
      setFeedback(error.message);
    } finally {
      if (delayedSettle) {
        window.setTimeout(() => {
          setLoading(false);
        }, SPIN_SETTLE_MS);
      } else {
        setLoading(false);
      }
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

          <div>
            <p className="text-sm text-gray-400">Bet Type</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {["color", "number"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setBetType(type);
                    setSelection(type === "color" ? "red" : 0);
                  }}
                  className={`rounded-xl px-4 py-3 font-semibold transition ${
                    betType === type ? "bg-orange-500 text-black" : "bg-[#1e293b] text-white/75"
                  }`}
                >
                  {type === "color" ? "Color" : "Number"}
                </button>
              ))}
            </div>
          </div>

          {betType === "color" ? (
            <div>
              <p className="text-sm text-gray-400">Choose Color</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {["red", "black", "green"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelection(color)}
                    className={`rounded-xl px-4 py-3 font-semibold capitalize transition ${
                      selection === color
                        ? color === "red"
                          ? "bg-red-600 text-white"
                          : color === "black"
                          ? "bg-slate-800 text-white"
                          : "bg-emerald-500 text-slate-950"
                        : "bg-[#1e293b] text-white/75"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-400">Pick Number</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {Array.from({ length: 37 }, (_, index) => {
                  const color = getColor(index);
                  const isSelected = selectedNumbers.has(index);

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelection(index)}
                      className={`rounded-lg p-2 text-sm font-bold transition ${
                        isSelected
                          ? color === "red"
                            ? "bg-red-600 text-white shadow-[0_0_16px_rgba(220,38,38,0.5)]"
                            : color === "black"
                            ? "bg-slate-900 text-white shadow-[0_0_16px_rgba(15,23,42,0.65)]"
                            : "bg-emerald-500 text-slate-950 shadow-[0_0_16px_rgba(34,197,94,0.5)]"
                          : color === "red"
                          ? "bg-red-950/80 text-red-100"
                          : color === "black"
                          ? "bg-slate-800 text-white/80"
                          : "bg-emerald-950/80 text-emerald-100"
                      }`}
                    >
                      {index}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm text-gray-400">Client Seed</p>
            <input
              value={clientSeed}
              onChange={(event) => setClientSeed(event.target.value)}
              className="mt-2 w-full rounded-lg bg-[#1e293b] p-3 text-white outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSpin}
            disabled={loading}
            className="w-full rounded-xl bg-green-500 px-6 py-3 font-bold text-slate-950 transition hover:bg-green-400 disabled:opacity-50"
          >
            {loading ? "Spinning..." : "Spin"}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-xl border border-white/10 px-6 py-3 font-semibold text-white/75 transition hover:border-white/25 hover:text-white"
          >
            Back To Lobby
          </button>

          {feedback && <p className="text-sm text-white/70">{feedback}</p>}
        </div>
      </div>

      <div className="min-w-0 flex-1 rounded-2xl bg-[#0b0f1a] p-6">
        <div className="flex h-full w-full flex-col items-center justify-center overflow-hidden">
          <RouletteWheel spin={spin} resultIndex={result?.index ?? 0} spinning={spinning} />

          <div className="mt-8 w-full max-w-4xl rounded-2xl bg-[#0f172a] p-5 shadow-[0_0_40px_rgba(34,197,94,0.08)]">
            <p className="text-sm uppercase tracking-[0.25em] text-white/45">Betting Board</p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {Array.from({ length: 36 }, (_, index) => {
                const num = index + 1;
                const isRed = redNumbers.has(num);
                const isSelected = betType === "number" && Number(selection) === num;

                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setBetType("number");
                      setSelection(num);
                    }}
                    className={`rounded-lg p-2 text-sm font-bold transition ${
                      isSelected
                        ? "ring-2 ring-yellow-300"
                        : ""
                    } ${isRed ? "bg-red-600 text-white" : "bg-slate-700 text-white"}`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>

            {result && (
              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-black/20 p-4">
                  <p className="text-sm text-white/45">Number</p>
                  <p className="mt-2 text-2xl font-bold text-white">{result.number}</p>
                </div>
                <div className="rounded-xl bg-black/20 p-4">
                  <p className="text-sm text-white/45">Color</p>
                  <p className="mt-2 text-2xl font-bold capitalize text-white">{result.color}</p>
                </div>
                <div className="rounded-xl bg-black/20 p-4">
                  <p className="text-sm text-white/45">Payout</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-300">${result.payout.toFixed(2)}</p>
                </div>
                <div className="rounded-xl bg-black/20 p-4">
                  <p className="text-sm text-white/45">Result</p>
                  <p className={`mt-2 text-2xl font-bold ${result.win ? "text-emerald-300" : "text-rose-300"}`}>
                    {result.win ? "Win" : "Lose"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
