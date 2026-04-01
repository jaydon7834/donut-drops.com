import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { api } from "../lib/api.js";
import { formatBetInput, parseBetInput } from "../lib/betting.js";
import { triggerGameEffect } from "../lib/gameEffects.js";

function formatMultiplier(value) {
  return `${Number(value || 1).toFixed(2)}x`;
}

function playTone({ type = "sine", from = 220, to = 220, peak = 0.02, duration = 0.12 }) {
  if (typeof window === "undefined" || !window.AudioContext) {
    return;
  }

  const context = new window.AudioContext();
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, to), now + duration);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + Math.min(0.03, duration / 2));
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.01);
  oscillator.onended = () => {
    context.close().catch(() => {});
  };
}

function playTick(multiplierValue) {
  playTone({
    type: "triangle",
    from: 220 + multiplierValue * 25,
    to: 250 + multiplierValue * 35,
    peak: 0.012,
    duration: 0.055
  });
}

function playWinSound() {
  playTone({ type: "triangle", from: 420, to: 760, peak: 0.024, duration: 0.18 });
  window.setTimeout(() => {
    playTone({ type: "sine", from: 640, to: 980, peak: 0.02, duration: 0.16 });
  }, 90);
}

function playLossSound() {
  playTone({ type: "sawtooth", from: 180, to: 90, peak: 0.03, duration: 0.16 });
}

export function LimboGame({ token, user, onBalanceChange, onBack }) {
  const [betAmount, setBetAmount] = useState(20);
  const [betInput, setBetInput] = useState("20");
  const [target, setTarget] = useState(2);
  const [targetInput, setTargetInput] = useState("2.00");
  const [clientSeed, setClientSeed] = useState(user.clientSeed || "donutdrop-default");
  const [displayMultiplier, setDisplayMultiplier] = useState(1);
  const [result, setResult] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [flashState, setFlashState] = useState("idle");
  const [history, setHistory] = useState([]);
  const [passedTarget, setPassedTarget] = useState(false);
  const [rollMeta, setRollMeta] = useState(null);
  const animationFrameRef = useRef(null);
  const tickTimeoutRef = useRef(null);
  const passedTargetRef = useRef(false);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      if (tickTimeoutRef.current) {
        window.clearTimeout(tickTimeoutRef.current);
      }
    };
  }, []);

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

  function handleTargetChange(value) {
    const parsed = Number(value);
    setTargetInput(value);

    if (Number.isFinite(parsed)) {
      const clamped = Math.min(100, Math.max(1.01, parsed));
      setTarget(Number(clamped.toFixed(2)));
    }
  }

  function stopActiveAnimation() {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (tickTimeoutRef.current) {
      window.clearTimeout(tickTimeoutRef.current);
      tickTimeoutRef.current = null;
    }
  }

  function animateMultiplier(finalValue, onEnd) {
    stopActiveAnimation();
    const duration = Math.min(1200, Math.max(650, 620 + finalValue * 85));
    const startValue = 1;
    const startTime = performance.now();
    let lastTickValue = startValue;

    passedTargetRef.current = false;
    setPassedTarget(false);
    setFlashState("rolling");
    setDisplayMultiplier(startValue);

    function update(time) {
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const overshoot = progress === 1 ? 0 : Math.sin(progress * Math.PI) * Math.min(0.06, finalValue * 0.01);
      const nextValue = startValue + (finalValue - startValue) * eased + overshoot;
      const clampedValue = progress === 1 ? finalValue : Math.max(1, nextValue);

      setDisplayMultiplier(clampedValue);

      if (!passedTargetRef.current && clampedValue >= target) {
        passedTargetRef.current = true;
        setPassedTarget(true);
        setFlashState("target-pass");
        playTone({ type: "triangle", from: 520, to: 840, peak: 0.018, duration: 0.08 });
      }

      if (clampedValue - lastTickValue >= 0.18) {
        lastTickValue = clampedValue;
        playTick(clampedValue);
      }

      if (progress < 1) {
        animationFrameRef.current = window.requestAnimationFrame(update);
      } else {
        setDisplayMultiplier(finalValue);
        animationFrameRef.current = null;
        onEnd();
      }
    }

    animationFrameRef.current = window.requestAnimationFrame(update);
  }

  async function playLimbo() {
    setRolling(true);
    setFeedback("");
    setResult(null);
    setRollMeta(null);
    setFlashState("rolling");

    try {
      const data = await api.rollLimbo(token, {
        bet: parseBetInput(betInput),
        target,
        clientSeed
      });

      animateMultiplier(data.game.multiplier, () => {
        const didWin = data.game.win;
        setResult(didWin ? "win" : "lose");
        setRolling(false);
        setFlashState(didWin ? "win" : "lose");
        setRollMeta(data.game);
        onBalanceChange(data.balance);
        triggerGameEffect(
          didWin
            ? Number(data.game.payout || 0) >= Number(data.game.bet || 0) * 3
              ? "big-win"
              : "win"
            : "loss"
        );
        setFeedback(didWin ? `YOU WON $${data.game.payout.toFixed(2)}` : "YOU LOST");
        setHistory((current) =>
          [
            {
              id: data.game.gameId,
              multiplier: data.game.multiplier,
              win: didWin
            },
            ...current
          ].slice(0, 8)
        );

        if (didWin) {
          playWinSound();
        } else {
          playLossSound();
          if (!passedTargetRef.current) {
            setFlashState("target-fail");
          }
        }
      });
    } catch (error) {
      stopActiveAnimation();
      setRolling(false);
      setDisplayMultiplier(1);
      setResult(null);
      setRollMeta(null);
      setFlashState("idle");
      setFeedback(error.message);
    }
  }

  const targetPercent = Math.min(100, Math.max(0, (target / 100) * 100));
  const displayText = formatMultiplier(displayMultiplier);

  return (
    <div className="flex w-full min-w-0 flex-col gap-6 p-4 xl:flex-row xl:items-stretch xl:p-6">
      <div className="w-full shrink-0 rounded-2xl bg-[#0f172a] p-5 xl:w-[240px]">
        <div className="space-y-4 text-white">
          <div>
            <p className="text-gray-400 text-sm">Bet Amount</p>
            <div className="mt-2 flex overflow-hidden rounded-xl bg-[#1e293b] ring-1 ring-white/5 transition focus-within:ring-2 focus-within:ring-orange-500">
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
            <p className="text-gray-400 text-sm">Target Multiplier</p>
            <input
              value={targetInput}
              onChange={(event) => handleTargetChange(event.target.value)}
              className="mt-2 w-full rounded-xl bg-[#1e293b] p-3 text-white outline-none ring-1 ring-white/5 transition focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <input
            type="range"
            min="1.01"
            max="100"
            step="0.01"
            value={target}
            onChange={(event) => {
              const nextTarget = Number(event.target.value);
              setTarget(nextTarget);
              setTargetInput(nextTarget.toFixed(2));
            }}
            className="w-full accent-emerald-400"
          />

          <div>
            <p className="text-gray-400 text-sm">Client Seed</p>
            <input
              value={clientSeed}
              onChange={(event) => setClientSeed(event.target.value)}
              className="mt-2 w-full rounded-xl bg-[#1e293b] p-3 text-white outline-none ring-1 ring-white/5 transition focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            type="button"
            onClick={playLimbo}
            disabled={rolling}
            className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-orange-400 p-3 font-bold text-slate-950 shadow-[0_0_25px_rgba(251,146,60,0.2)] transition hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(16,185,129,0.25)] active:scale-[0.98] disabled:opacity-50"
          >
            {rolling ? "Rolling..." : "Place Bet"}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-white/75 transition hover:border-white/25 hover:text-white"
          >
            Back To Lobby
          </button>
        </div>
      </div>

      <motion.div
        animate={
          result === "lose"
            ? { x: [0, -6, 6, -4, 4, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.32 }}
        className={`min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/6 p-6 transition ${
          result === "win"
            ? "bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.08),transparent_45%),linear-gradient(180deg,#07120e,#0b0f1a)] shadow-[0_0_65px_rgba(0,255,136,0.16)]"
            : result === "lose"
            ? "bg-[radial-gradient(circle_at_center,rgba(255,59,59,0.08),transparent_45%),linear-gradient(180deg,#14090b,#0b0f1a)] shadow-[0_0_55px_rgba(255,59,59,0.14)]"
            : "bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.08),transparent_45%),linear-gradient(180deg,#07101d,#0b0f1a)] shadow-[0_0_40px_rgba(96,165,250,0.1)]"
        }`}
      >
        <div className="relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-[1.8rem] border border-white/6 bg-[linear-gradient(180deg,#090f1f,#05070d)] px-6 py-8">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute inset-0 bg-[linear-gradient(transparent_96%,rgba(255,255,255,0.05)_100%)] bg-[length:100%_42px]" />
            <motion.div
              animate={{ y: [0, 18, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[12%] top-[18%] h-2 w-2 rounded-full bg-white/25 blur-[1px]"
            />
            <motion.div
              animate={{ y: [0, -22, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-[18%] top-[28%] h-1.5 w-1.5 rounded-full bg-emerald-300/35 blur-[1px]"
            />
            <motion.div
              animate={{ y: [0, 24, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-[72%] top-[48%] h-2 w-2 rounded-full bg-sky-300/30 blur-[1px]"
            />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-indigo-200/65">Limbo Roll</p>
              <p className="mt-2 text-sm text-white/50">Watch the multiplier climb and try to clear your target.</p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/75">
              Target {target.toFixed(2)}x
            </div>
          </div>

          <div className="relative z-10 mt-12 flex flex-1 flex-col items-center justify-center">
            <div className="mb-6 text-xs uppercase tracking-[0.32em] text-white/35">Rolled Multiplier</div>

            <div className="relative flex w-full max-w-[620px] flex-col items-center">
              <div className="relative h-5 w-full">
                <motion.div
                  animate={
                    flashState === "target-pass"
                      ? { opacity: [0.5, 1, 0.65] }
                      : flashState === "target-fail"
                      ? { opacity: [0.4, 1, 0.45] }
                      : { opacity: 0.5 }
                  }
                  transition={{ duration: 0.28 }}
                  className={`absolute top-2 h-[3px] -translate-x-1/2 rounded-full ${
                    flashState === "target-fail"
                      ? "bg-rose-400 shadow-[0_0_18px_rgba(255,59,59,0.7)]"
                      : "bg-emerald-300 shadow-[0_0_18px_rgba(0,255,136,0.55)]"
                  }`}
                  style={{ left: `${targetPercent}%`, width: "68px" }}
                />
                <div className="absolute inset-x-0 top-2 h-px bg-white/10" />
              </div>

              <motion.div
                animate={{
                  scale: result === "win" ? [1, 1.08, 1] : result === "lose" ? [1, 1.03, 1] : rolling ? [1, 1.015, 1] : 1,
                  filter: rolling ? ["blur(1px)", "blur(0px)", "blur(0.6px)"] : "blur(0px)",
                  boxShadow:
                    result === "win"
                      ? ["0 0 0 rgba(0,255,136,0)", "0 0 40px rgba(0,255,136,0.45)", "0 0 72px rgba(0,255,136,0.18)"]
                      : result === "lose"
                      ? ["0 0 0 rgba(255,59,59,0)", "0 0 36px rgba(255,59,59,0.38)", "0 0 12px rgba(255,59,59,0.18)"]
                      : ["0 0 18px rgba(147,197,253,0.12)", "0 0 32px rgba(147,197,253,0.2)", "0 0 18px rgba(147,197,253,0.12)"]
                }}
                transition={{ duration: rolling ? 0.5 : 0.35, repeat: rolling ? Infinity : 0, ease: "easeOut" }}
                className={`rounded-[2rem] px-10 py-7 text-center text-7xl font-black tracking-tight sm:text-8xl ${
                  result === "win"
                    ? "text-[#5fffb2]"
                    : result === "lose"
                    ? "text-[#ff7272]"
                    : "text-white"
                }`}
              >
                {displayText}
              </motion.div>

              <div className="mt-5 flex items-center gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                  {rolling ? "Rolling" : result === "win" ? "Win" : result === "lose" ? "Loss" : "Ready"}
                </span>
                <span className={`text-sm font-semibold ${passedTarget ? "text-emerald-300" : "text-white/45"}`}>
                  {passedTarget ? "Target cleared" : "Target waiting"}
                </span>
              </div>
            </div>

            <div className="mt-10 grid w-full max-w-[760px] gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/35">Bet</p>
                <p className="mt-2 text-2xl font-black text-white">${parseBetInput(betInput)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/35">Target</p>
                <p className="mt-2 text-2xl font-black text-amber-300">{target.toFixed(2)}x</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/35">Payout</p>
                <p className={`mt-2 text-2xl font-black ${result === "win" ? "text-emerald-300" : "text-white"}`}>
                  ${rollMeta?.payout?.toFixed?.(2) || "0.00"}
                </p>
              </div>
            </div>

            {feedback && <p className="mt-6 text-sm text-white/65">{feedback}</p>}
          </div>

          <div className="relative z-10 mt-8">
            <p className="text-xs uppercase tracking-[0.25em] text-white/35">Last Rolls</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {history.length === 0 ? (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/45">
                  No rolls yet
                </span>
              ) : (
                history.map((entry) => (
                  <span
                    key={entry.id}
                    className={`rounded-full px-3 py-2 text-sm font-bold ${
                      entry.win
                        ? "bg-emerald-500/15 text-emerald-300 shadow-[0_0_18px_rgba(0,255,136,0.14)]"
                        : "bg-rose-500/15 text-rose-300 shadow-[0_0_18px_rgba(255,59,59,0.1)]"
                    }`}
                  >
                    {formatMultiplier(entry.multiplier)}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
