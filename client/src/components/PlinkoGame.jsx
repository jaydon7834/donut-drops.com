import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";

const PLINKO_RISK_TABLES = {
  low: [2, 1.5, 1.2, 1.1, 1.05, 1.02, 1, 1.02, 1.05, 1.1, 1.2, 1.5, 2],
  medium: [5, 3, 2, 1.5, 1.2, 0.8, 0.5, 0.8, 1.2, 1.5, 2, 3, 5],
  high: [33, 11, 4, 2, 1.2, 0.5, 0.2, 0.5, 1.2, 2, 4, 11, 33]
};

function interpolateValue(source, position) {
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);

  if (lowerIndex === upperIndex) {
    return source[lowerIndex];
  }

  const weight = position - lowerIndex;
  return source[lowerIndex] * (1 - weight) + source[upperIndex] * weight;
}

function getPlinkoMultipliers(rows, risk) {
  const source = PLINKO_RISK_TABLES[risk] || PLINKO_RISK_TABLES.medium;
  const bucketCount = rows + 1;

  if (bucketCount === source.length) {
    return source;
  }

  return Array.from({ length: bucketCount }, (_, index) => {
    const position = (index / (bucketCount - 1)) * (source.length - 1);
    return Number(interpolateValue(source, position).toFixed(2));
  });
}

function buildKeyframes(path, rows) {
  const horizontalStep = Math.max(12, 18 - (rows - 8) * 0.6);
  const verticalStep = Math.max(20, 28 - (rows - 8) * 0.5);
  let x = 0;
  let y = 0;

  return path.map((direction) => {
    x += direction * horizontalStep;
    y += verticalStep;
    return { x, y };
  });
}

export function PlinkoGame({ token, user, onBalanceChange, onBack }) {
  const [betAmount, setBetAmount] = useState(20);
  const [betInput, setBetInput] = useState("20");
  const [rows, setRows] = useState(12);
  const [risk, setRisk] = useState("medium");
  const [ballCount, setBallCount] = useState(1);
  const [autoDrop, setAutoDrop] = useState(false);
  const [clientSeed, setClientSeed] = useState(user.clientSeed || "donutdrop-default");
  const [activeBalls, setActiveBalls] = useState([]);
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [queueRemaining, setQueueRemaining] = useState(0);
  const dropIntervalRef = useRef(null);
  const autoRestartTimeoutRef = useRef(null);
  const queueRemainingRef = useRef(0);
  const isResultSynced = result?.rows === rows && result?.risk === risk;
  const multipliers = useMemo(
    () => (isResultSynced ? result?.multipliers : null) || getPlinkoMultipliers(rows, risk),
    [isResultSynced, result?.multipliers, risk, rows]
  );
  const lastPayout = result ? Number((result.bet * result.multiplier).toFixed(2)) : 0;

  const dropping = queueRemaining > 0 || activeBalls.length > 0;

  useEffect(() => {
    queueRemainingRef.current = queueRemaining;
  }, [queueRemaining]);

  useEffect(() => {
    return () => {
      if (dropIntervalRef.current) {
        window.clearInterval(dropIntervalRef.current);
      }
      if (autoRestartTimeoutRef.current) {
        window.clearTimeout(autoRestartTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (queueRemaining <= 0 || dropIntervalRef.current) {
      return undefined;
    }

    async function releaseBall() {
      if (queueRemainingRef.current <= 0) {
        return;
      }

      setQueueRemaining((current) => {
        if (current <= 0) {
          return 0;
        }
        return current - 1;
      });

      try {
        const data = await api.dropPlinko(token, {
          bet: parseBetInput(betInput),
          rows,
          risk,
          clientSeed
        });

        const ballId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
        const nextBall = {
          id: ballId,
          frames: buildKeyframes(data.game.path || [], rows),
          bucketIndex: data.game.bucketIndex,
          risk
        };

        setActiveBalls((current) => [...current, nextBall]);
        setResult(data.game);
        setFeedback(`Latest hit: ${data.game.multiplier}x`);
        onBalanceChange(data.balance);

        window.setTimeout(() => {
          setActiveBalls((current) => current.filter((entry) => entry.id !== ballId));
        }, 1600);
      } catch (error) {
        setFeedback(error.message);
        setQueueRemaining(0);
      }
    }

    releaseBall();

    dropIntervalRef.current = window.setInterval(() => {
      if (queueRemainingRef.current <= 0) {
        return;
      }
      releaseBall();
    }, 1000);

    return () => {
      if (dropIntervalRef.current && queueRemaining <= 1) {
        window.clearInterval(dropIntervalRef.current);
        dropIntervalRef.current = null;
      }
    };
  }, [betInput, clientSeed, onBalanceChange, queueRemaining, risk, rows, token]);

  useEffect(() => {
    if (queueRemaining > 0) {
      return;
    }

    if (dropIntervalRef.current) {
      window.clearInterval(dropIntervalRef.current);
      dropIntervalRef.current = null;
    }
  }, [queueRemaining]);

  useEffect(() => {
    if (!autoDrop || dropping) {
      return undefined;
    }

    autoRestartTimeoutRef.current = window.setTimeout(() => {
      setFeedback("");
      setResult(null);
      setQueueRemaining(Math.max(1, Math.min(25, Number(ballCount) || 1)));
    }, 250);

    return () => {
      if (autoRestartTimeoutRef.current) {
        window.clearTimeout(autoRestartTimeoutRef.current);
        autoRestartTimeoutRef.current = null;
      }
    };
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

  function handleToggleAutoDrop() {
    setAutoDrop((current) => {
      const next = !current;

      if (!next) {
        if (autoRestartTimeoutRef.current) {
          window.clearTimeout(autoRestartTimeoutRef.current);
          autoRestartTimeoutRef.current = null;
        }
        if (dropIntervalRef.current) {
          window.clearInterval(dropIntervalRef.current);
          dropIntervalRef.current = null;
        }
        setQueueRemaining(0);
        setFeedback("Auto drop stopped.");
      }

      return next;
    });
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 p-4 xl:flex-row xl:items-stretch xl:p-4">
      <div className="w-full shrink-0 rounded-2xl bg-[#0f172a] p-4 text-white xl:w-[150px]">
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
            <p className="text-sm text-gray-400">Risk</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[
                { id: "low", label: "Low", active: "bg-green-500 text-slate-950" },
                { id: "medium", label: "Medium", active: "bg-yellow-500 text-slate-950" },
                { id: "high", label: "High", active: "bg-red-500 text-white" }
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setRisk(option.id)}
                  disabled={dropping}
                  className={`rounded-xl px-3 py-2 text-sm font-bold transition ${
                    risk === option.id ? option.active : "bg-[#1e293b] text-white/80 hover:bg-[#243244]"
                  } disabled:opacity-50`}
                >
                  {option.label}
                </button>
              ))}
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
            onClick={handleToggleAutoDrop}
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
            {dropping ? `Dropping... ${queueRemaining || activeBalls.length} left` : `Start Drop (${ballCount})`}
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

<<<<<<< HEAD
      <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl bg-[#0b0f1a] p-4 xl:p-5">
        <div className="mb-4 grid gap-3 text-white sm:grid-cols-3">
          <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-200/55">Setup</p>
            <p className="mt-2 text-2xl font-black">{rows} Rows</p>
            <p className="mt-1 text-sm text-cyan-100/70">{risk} risk</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Best Hit</p>
            <p className="mt-2 text-2xl font-black text-emerald-300">{Math.max(...multipliers)}x</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Latest Payout</p>
            <p className="mt-2 text-2xl font-black text-white">{result ? `$${lastPayout.toFixed(2)}` : "--"}</p>
=======
      <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl bg-[#0b0f1a] p-2 xl:p-3">
        <div className="flex h-full min-h-[340px] w-full items-center justify-center xl:min-h-[400px]">
          <div className="relative flex w-full justify-center">
          <div className="mt-2 flex origin-top scale-[0.44] flex-col items-center sm:scale-[0.52] xl:scale-[0.6] 2xl:scale-[0.68]">
            {Array.from({ length: rows }).map((_, row) => (
              <div key={row} className="flex justify-center">
                {Array.from({ length: row + 1 }).map((__, index) => (
                  <div
                    key={`${row}-${index}`}
                    className="m-1 h-2 w-2 rounded-full bg-gray-400 shadow-[0_0_16px_rgba(148,163,184,0.35)] xl:m-1.5 xl:h-2.5 xl:w-2.5"
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
              className="absolute left-1/2 top-2.5 h-3 w-3 -translate-x-1/2 rounded-full bg-green-400 shadow-[0_0_24px_rgba(74,222,128,0.8)] xl:top-3 xl:h-3.5 xl:w-3.5"
            />
          ))}
>>>>>>> 9c4e097 (Make mines and plinko significantly smaller)
          </div>
        </div>

        <div className="relative min-h-[520px] xl:min-h-[600px]">
          <div className="flex h-full w-full items-center justify-center pb-12">
            <div className="relative flex w-full justify-center">
              <div className="mt-2 flex origin-top scale-[0.7] flex-col items-center sm:scale-[0.78] xl:scale-[0.88] 2xl:scale-[0.96]">
                {Array.from({ length: rows }).map((_, row) => (
                  <div key={row} className="flex justify-center">
                    {Array.from({ length: row + 1 }).map((__, index) => (
                      <div
                        key={`${row}-${index}`}
                        className="m-1.5 h-3 w-3 rounded-full bg-slate-300 shadow-[0_0_18px_rgba(148,163,184,0.45)] xl:m-2 xl:h-3 xl:w-3"
                      />
                    ))}
                  </div>
                ))}
              </div>

              {activeBalls.map((ball) => (
                <div key={ball.id}>
                  <motion.div
                    initial={{ x: 0, y: 0, opacity: 0.6 }}
                    animate={ball.frames.map((frame) => ({ ...frame, opacity: 0.15 }))}
                    transition={{ duration: 1.45, ease: "easeInOut" }}
                    className={`absolute left-1/2 top-4 h-3 w-3 -translate-x-1/2 rounded-full blur-sm xl:top-5 ${
                      ball.risk === "high"
                        ? "bg-red-400"
                        : ball.risk === "low"
                        ? "bg-green-300"
                        : "bg-yellow-300"
                    }`}
                  />
                  <motion.div
                    initial={{ x: 0, y: 0, scale: 0.9 }}
                    animate={ball.frames.map((frame, index) => ({
                      ...frame,
                      scale: index === ball.frames.length - 1 ? 1.15 : index % 2 === 0 ? 1.04 : 0.96
                    }))}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="absolute left-1/2 top-4 h-4 w-4 -translate-x-1/2 rounded-full bg-green-400 shadow-[0_0_24px_rgba(74,222,128,0.8)] xl:top-5 xl:h-4 xl:w-4"
                  />
                </div>
              ))}
            </div>
          </div>

          <div
            className="absolute inset-x-0 bottom-0 mx-auto grid w-full max-w-[780px] gap-1 px-1"
            style={{ gridTemplateColumns: `repeat(${multipliers.length}, minmax(0, 1fr))` }}
          >
            {multipliers.map((multiplier, index) => (
              <motion.div
                key={index}
                animate={
                  result?.bucketIndex === index ? { scale: [1, 1.12, 1.04], y: [0, -4, 0] } : { scale: 1, y: 0 }
                }
                transition={{ duration: 0.35 }}
                className={`rounded-md border px-0.5 py-1 text-center text-[8px] font-black leading-none sm:text-[9px] xl:text-[10px] ${
                  result?.bucketIndex === index
                    ? "border-green-300/60 bg-green-500 text-slate-950 shadow-[0_0_18px_rgba(34,197,94,0.45)]"
                    : multiplier >= 10
                    ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
                    : multiplier >= 2
                    ? "border-cyan-300/15 bg-cyan-400/8 text-cyan-100"
                    : multiplier >= 1
                    ? "border-emerald-300/15 bg-emerald-400/8 text-emerald-100"
                    : "border-white/8 bg-[#111827] text-white/80"
                }`}
              >
                {Number(multiplier).toFixed(multiplier >= 10 ? 0 : multiplier % 1 === 0 ? 0 : 2).replace(/\.00$/, "")}x
              </motion.div>
            ))}
          </div>
        </div>

        {result && (
          <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 px-4 py-3 text-center text-lg text-green-300">
            Latest hit: {result.multiplier}x in bucket {result.bucketIndex + 1}
          </div>
        )}
      </div>
    </div>
  );
}
