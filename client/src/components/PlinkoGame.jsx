import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";

const rows = 12;
const multipliers = [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33];

function buildKeyframes(path) {
  let x = 0;
  let y = 0;

  return path.map((direction) => {
    x += direction * 20;
    y += 30;
    return { x, y };
  });
}

export function PlinkoGame({ token, user, onBalanceChange, onBack }) {
  const [betAmount, setBetAmount] = useState(20);
  const [betInput, setBetInput] = useState("20");
  const [clientSeed, setClientSeed] = useState(user.clientSeed || "donutdrop-default");
  const [dropping, setDropping] = useState(false);
  const [result, setResult] = useState(null);
  const [ballFrames, setBallFrames] = useState([]);
  const [feedback, setFeedback] = useState("");

  const pathKeyframes = useMemo(() => buildKeyframes(ballFrames), [ballFrames]);

  useEffect(() => {
    if (!dropping) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setDropping(false);
    }, 1600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dropping]);

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

  async function handleDrop() {
    setDropping(true);
    setFeedback("");
    setResult(null);

    try {
      const data = await api.dropPlinko(token, {
        bet: parseBetInput(betInput),
        rows,
        clientSeed
      });

      setBallFrames(data.game.path || []);
      onBalanceChange(data.balance);

      window.setTimeout(() => {
        setResult(data.game);
        setFeedback(`Won ${data.game.multiplier}x 💰`);
      }, 1500);
    } catch (error) {
      setDropping(false);
      setFeedback(error.message);
    }
  }

  return (
    <div className="grid grid-cols-[320px_1fr] gap-6 p-6">
      <div className="bg-[#0f172a] rounded-2xl p-5 text-white">
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
            <p className="text-sm text-gray-400">Rows</p>
            <div className="mt-2 rounded-xl bg-[#1e293b] px-4 py-3 text-white">{rows}</div>
          </div>

          <div>
            <p className="text-sm text-gray-400">Client Seed</p>
            <input
              value={clientSeed}
              onChange={(event) => setClientSeed(event.target.value)}
              className="mt-2 w-full p-3 bg-[#1e293b] rounded-xl text-white outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleDrop}
            disabled={dropping}
            className="w-full bg-green-500 hover:bg-green-600 p-3 rounded-xl font-bold text-slate-950 disabled:opacity-50"
          >
            {dropping ? "Dropping..." : "Drop Ball"}
          </button>

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

      <div className="bg-[#0b0f1a] rounded-2xl p-6 flex flex-col items-center relative overflow-hidden">
        <div className="relative w-full max-w-3xl min-h-[560px]">
          <div className="flex flex-col items-center mt-10">
            {Array.from({ length: rows }).map((_, row) => (
              <div key={row} className="flex justify-center">
                {Array.from({ length: row + 1 }).map((__, index) => (
                  <div
                    key={`${row}-${index}`}
                    className="w-2 h-2 bg-gray-500 rounded-full m-2 shadow-[0_0_12px_rgba(148,163,184,0.35)]"
                  />
                ))}
              </div>
            ))}
          </div>

          {dropping && pathKeyframes.length > 0 && (
            <motion.div
              initial={{ x: 0, y: 0 }}
              animate={pathKeyframes}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="w-4 h-4 bg-green-400 rounded-full absolute left-1/2 top-6 -translate-x-1/2 shadow-[0_0_20px_rgba(74,222,128,0.8)]"
            />
          )}
        </div>

        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          {multipliers.map((multiplier, index) => (
            <div
              key={index}
              className={`px-2 py-1 rounded text-sm ${
                result?.bucketIndex === index
                  ? "bg-green-500 text-slate-950 shadow-[0_0_24px_rgba(34,197,94,0.4)]"
                  : "bg-[#1e293b] text-white"
              }`}
            >
              {multiplier}x
            </div>
          ))}
        </div>

        {result && (
          <div className="mt-6 text-xl text-green-400">
            Won {result.multiplier}x 💰
          </div>
        )}
      </div>
    </div>
  );
}
