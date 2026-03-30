import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";

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
  const [rows, setRows] = useState(12);
  const [ballCount, setBallCount] = useState(1);
  const [autoDrop, setAutoDrop] = useState(false);
  const [clientSeed, setClientSeed] = useState(user.clientSeed || "donutdrop-default");
  const [activeBalls, setActiveBalls] = useState([]);
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [queueRemaining, setQueueRemaining] = useState(0);

  const dropping = queueRemaining > 0 || activeBalls.length > 0;

  useEffect(() => {
    if (queueRemaining <= 0) {
      return undefined;
    }

    let cancelled = false;

    async function releaseBall() {
      try {
        const data = await api.dropPlinko(token, {
          bet: parseBetInput(betInput),
          rows,
          clientSeed
        });

        if (cancelled) {
          return;
        }

        const ballId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const nextBall = {
          id: ballId,
          frames: buildKeyframes(data.game.path || []),
          bucketIndex: data.game.bucketIndex
        };

        setActiveBalls((current) => [...current, nextBall]);
        setResult(data.game);
        setFeedback(`Latest hit: ${data.game.multiplier}x`);
        onBalanceChange(data.balance);

        window.setTimeout(() => {
          setActiveBalls((current) => current.filter((entry) => entry.id !== ballId));
        }, 1600);
      } catch (error) {
        if (!cancelled) {
          setFeedback(error.message);
          setQueueRemaining(0);
        }
      }
    }

    releaseBall();

    const timeoutId = window.setTimeout(() => {
      setQueueRemaining((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [betInput, clientSeed, onBalanceChange, queueRemaining, rows, token]);

  useEffect(() => {
    if (!autoDrop || dropping) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback("");
      setResult(null);
      setQueueRemaining(Math.max(1, Math.min(25, Number(ballCount) || 1)));
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [autoDrop, ballCount, dropping]);

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

  function handleDrop() {
    if (dropping) {
      return;
    }

    setFeedback("");
    setResult(null);
    setQueueRemaining(Math.max(1, Math.min(25, Number(ballCount) || 1)));
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 p-4 xl:flex-row xl:items-stretch xl:p-6">
      <div className="w-full shrink-0 rounded-2xl bg-[#0f172a] p-5 text-white xl:w-[260px]">
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
            <div className="mt-2 rounded-xl bg-[#1e293b] px-4 py-3 text-white">
              <div className="flex items-center justify-between">
                <span>{rows}</span>
                <span className="text-xs text-white/45">8 - 16</span>
              </div>
              <input
                type="range"
                min="8"
                max="16"
                step="1"
                value={rows}
                onChange={(event) => setRows(Number(event.target.value))}
                className="mt-3 w-full accent-emerald-400"
                disabled={dropping}
              />
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400">Balls</p>
            <div className="mt-2 rounded-xl bg-[#1e293b] px-4 py-3 text-white">
              <div className="flex items-center justify-between">
                <span>{ballCount}</span>
                <span className="text-xs text-white/45">1 per sec</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={ballCount}
                onChange={(event) => setBallCount(Number(event.target.value))}
                className="mt-3 w-full accent-emerald-400"
                disabled={dropping}
              />
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400">Client Seed</p>
            <input
              value={clientSeed}
              onChange={(event) => setClientSeed(event.target.value)}
              className="mt-2 w-full rounded-xl bg-[#1e293b] p-3 text-white outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setAutoDrop((current) => !current)}
            className={`w-full rounded-xl p-3 font-bold transition ${
              autoDrop
                ? "bg-orange-500 text-slate-950 hover:bg-orange-400"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            {autoDrop ? "Auto Drop On" : "Auto Drop Off"}
          </button>

          <button
            type="button"
            onClick={handleDrop}
            disabled={dropping}
            className="w-full rounded-xl bg-green-500 p-3 font-bold text-slate-950 transition hover:bg-green-600 disabled:opacity-50"
          >
            {dropping ? `Dropping... ${queueRemaining || activeBalls.length} left` : `Drop ${ballCount} Ball${ballCount === 1 ? "" : "s"}`}
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

      <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl bg-[#0b0f1a] p-6 xl:p-10">
        <div className="flex h-full min-h-[980px] w-full items-center justify-center">
          <div className="relative min-h-[860px] w-full max-w-6xl">
          <div className="mt-4 flex origin-top scale-[1.45] flex-col items-center">
            {Array.from({ length: rows }).map((_, row) => (
              <div key={row} className="flex justify-center">
                {Array.from({ length: row + 1 }).map((__, index) => (
                  <div
                    key={`${row}-${index}`}
                    className="m-3 h-3.5 w-3.5 rounded-full bg-gray-400 shadow-[0_0_16px_rgba(148,163,184,0.35)]"
                  />
                ))}
              </div>
            ))}
          </div>

          {activeBalls.map((ball) => (
            <motion.div
              key={ball.id}
              initial={{ x: 0, y: 0 }}
              animate={ball.frames}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute left-1/2 top-6 h-6 w-6 -translate-x-1/2 rounded-full bg-green-400 shadow-[0_0_24px_rgba(74,222,128,0.8)]"
            />
          ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {multipliers.map((multiplier, index) => (
            <div
              key={index}
              className={`rounded px-2 py-1 text-sm ${
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
          <div className="mt-6 text-center text-xl text-green-400">
            Latest hit: {result.multiplier}x
          </div>
        )}
      </div>
    </div>
  );
}
