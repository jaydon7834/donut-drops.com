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

export function Header({ user, activeGame, setActiveGame, onLogout }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel flex flex-col gap-4 rounded-3xl p-5 lg:flex-row lg:items-center lg:justify-between"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-accent">DonutDrop</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Casino motion with verifiable odds</h1>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="rounded-2xl bg-white/5 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.3em] text-white/45">Wallet</p>
          <p className="mt-1 text-xl font-semibold text-mint">${formatWalletAmount(user.balance)}</p>
        </div>

        <div className="flex rounded-full bg-white/5 p-1">
          {["mines", "dice"].map((game) => (
            <button
              key={game}
              type="button"
              onClick={() => setActiveGame(game)}
              className={`rounded-full px-4 py-2 text-sm capitalize transition ${
                activeGame === game ? "bg-white text-black" : "text-white/60 hover:text-white"
              }`}
            >
              {game}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/75 transition hover:border-white/30 hover:text-white"
        >
          Logout
        </button>
      </div>
    </motion.header>
  );
}
