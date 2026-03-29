export function Sidebar({ user, recentGames, clientSeed, setClientSeed, onSaveSeed, savingSeed }) {
  return (
    <aside className="space-y-5">
      <section className="glass-panel rounded-3xl p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-white/45">Profile</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{user.username}</h2>
        <p className="text-sm text-white/60">{user.email}</p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-white/45">Balance</p>
            <p className="mt-2 text-lg font-semibold text-mint">${user.balance?.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl bg-white/5 p-4">
            <p className="text-white/45">Nonce</p>
            <p className="mt-2 text-lg font-semibold text-white">{user.nonce}</p>
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
