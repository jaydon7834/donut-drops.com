import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

function formatWalletAmount(value) {
  const amount = Number(value || 0);

  if (amount >= 1_000_000_000) {
    return `${trimCompact(amount / 1_000_000_000)}b`;
  }

  if (amount >= 1_000_000) {
    return `${trimCompact(amount / 1_000_000)}m`;
  }

  if (amount >= 1_000) {
    return `${trimCompact(amount / 1_000)}k`;
  }

  return amount.toFixed(amount >= 100 ? 0 : 2).replace(/\.00$/, "");
}

function trimCompact(value) {
  return value.toFixed(value >= 10 ? 0 : 1).replace(/\.0$/, "");
}

export function WalletDisplay({ balance }) {
  const previousBalance = useRef(balance || 0);
  const [flash, setFlash] = useState("neutral");

  useEffect(() => {
    if (balance > previousBalance.current) {
      setFlash("win");
    } else if (balance < previousBalance.current) {
      setFlash("loss");
    }

    previousBalance.current = balance;
    const timeoutId = window.setTimeout(() => setFlash("neutral"), 900);
    return () => window.clearTimeout(timeoutId);
  }, [balance]);

  return (
    <motion.div
      animate={
        flash === "win"
          ? { boxShadow: "0 0 0 1px rgba(34,197,94,0.25), 0 0 24px rgba(34,197,94,0.28)" }
          : flash === "loss"
            ? { boxShadow: "0 0 0 1px rgba(244,63,94,0.25), 0 0 24px rgba(244,63,94,0.2)" }
            : { boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }
      }
      className="rounded-[1.4rem] bg-white/5 px-5 py-4"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-white/35">Wallet</p>
      <motion.p
        key={balance}
        initial={{ scale: 0.96, opacity: 0.75 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`mt-2 text-2xl font-black ${
          flash === "win" ? "text-emerald-300" : flash === "loss" ? "text-rose-300" : "text-mint"
        }`}
      >
        ${formatWalletAmount(balance)}
      </motion.p>
    </motion.div>
  );
}
