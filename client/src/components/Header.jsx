import { motion } from "framer-motion";

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
          <p className="mt-1 text-xl font-semibold text-mint">${user.balance?.toFixed(2)}</p>
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
