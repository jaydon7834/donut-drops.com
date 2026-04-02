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

export function Sidebar({ user, recentGames, clientSeed, setClientSeed, onSaveSeed, savingSeed }) {
  const stats = {
    winStreak: user.stats?.winStreak || 0,
    totalWagered: user.stats?.totalWagered || 0,
    biggestWin: user.stats?.biggestWin || 0
  };

  return (
    <aside className="space-y-5">
      <section className="glass-panel rounded-3xl p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-white/45">Profile</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{user.username}</h2>
        <p className="text-sm text-white/60">{user.email || "Ready to run it back"}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-white/45">Balance</p>
            <p className="mt-2 text-lg font-semibold text-mint">${formatWalletAmount(user.balance)}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-white/45">Nonce</p>
            <p className="mt-2 text-lg font-semibold text-white">{user.nonce}</p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-slate-950/60 p-4">
          <div className="grid gap-3 text-sm text-white/80">
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
              <span>🔥 Streak</span>
              <span className="font-semibold text-orange-300">{stats.winStreak}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
              <span>💰 Wagered</span>
              <span className="font-semibold text-emerald-300">${stats.totalWagered.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
              <span>🎯 Biggest Win</span>
              <span className="font-semibold text-sky-300">${stats.biggestWin.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-white/45">Provably Fair</p>
        <h3 className="mt-2 text-lg font-semibold text-white">Client seed control</h3>
        <input
          value={clientSeed}
          onChange={(event) => setClientSeed(event.target.value)}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-accent"
          placeholder="Enter client seed"
        />
        <button
          type="button"
          onClick={onSaveSeed}
          disabled={savingSeed}
          className="mt-3 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-50"
        >
          {savingSeed ? "Saving..." : "Save seed"}
        </button>
        <p className="mt-3 text-xs leading-6 text-white/55">
          Every round combines your client seed with a hidden server seed and an incrementing nonce.
        </p>
      </section>

      <section className="glass-panel rounded-3xl p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-white/45">Recent Games</p>
        <div className="mt-4 space-y-3">
          {recentGames.length === 0 ? (
            <p className="text-sm text-white/55">No rounds yet. Spin up a game to populate history.</p>
          ) : (
            recentGames.map((game) => (
              <div key={game._id} className="rounded-2xl bg-white/5 p-4 text-sm text-white/75">
                <div className="flex items-center justify-between capitalize">
                  <span>{game.gameType}</span>
                  <span className={game.profit >= 0 ? "text-emerald-300" : "text-rose-300"}>
                    {game.profit >= 0 ? "+" : ""}${game.profit.toFixed(2)}
                  </span>
                </div>
                <p className="mt-2 text-white/45">
                  Bet ${game.betAmount.toFixed(2)} | {game.status.replace("_", " ")}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </aside>
  );
}
