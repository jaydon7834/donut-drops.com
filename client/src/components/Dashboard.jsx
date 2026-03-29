import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";
import { MinesGame } from "./MinesGame.jsx";
import { DiceGame } from "./DiceGame.jsx";
import { FairnessCard } from "./FairnessCard.jsx";

const gameCards = [
  { id: "blackjack", label: "Blackjack", accent: "from-orange-700 via-orange-500 to-amber-300", players: 6 },
  { id: "mines", label: "Mines", accent: "from-emerald-900 via-emerald-500 to-lime-300", players: 8 },
  { id: "roulette", label: "Roulette", accent: "from-fuchsia-900 via-pink-500 to-amber-300", players: 7 },
  { id: "limbo", label: "Limbo", accent: "from-amber-800 via-orange-500 to-yellow-300", players: 6 },
  { id: "plinko", label: "Plinko", accent: "from-cyan-900 via-cyan-500 to-sky-300", players: 3 }
];

const sideGames = ["Cases", "Case Battles", "Blackjack", "Mines", "Plinko", "Limbo", "Dice", "Roulette", "Chicken"];

const chatMessages = [
  { user: "system", text: "Welcome to DonutDrop chat." },
  { user: "ghostyy7173", text: "can someone pay me" },
  { user: "QKID2010", text: "/pay schocate 1000" },
  { user: "striker2947", text: "/pay gasik or homo" },
  { user: "farex_x", text: "no stfu" },
  { user: "cnxsticp", text: "is legit?" }
];

function PlaceholderPanel({ title, onBack }) {
  return (
    <section className="glass-panel rounded-[2rem] p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-accent">{title}</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Lobby Coming Next</h2>
          <p className="mt-3 max-w-2xl text-white/60">
            This section is wired into the main screen now. Mines and Dice are playable today, and
            this game can be built next without changing the lobby structure again.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/75 transition hover:border-white/25 hover:text-white"
        >
          Back To Lobby
        </button>
      </div>
    </section>
  );
}

export function Dashboard() {
  const {
    token,
    user,
    recentGames,
    logout,
    refreshBalance,
    saveClientSeed,
    setUser,
    setRecentGames
  } = useAuth();
  const [activeView, setActiveView] = useState("lobby");
  const [clientSeed, setClientSeed] = useState(user?.clientSeed || "");
  const [savingSeed, setSavingSeed] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");

  useEffect(() => {
    setClientSeed(user?.clientSeed || "");
  }, [user?.clientSeed]);

  async function updateBalance(balance) {
    setUser((currentUser) => ({ ...currentUser, balance }));

    try {
      const data = await refreshBalance();
      if (data?.recentGames) {
        setRecentGames(data.recentGames);
      }
    } catch {
      // Auth context clears invalid sessions already.
    }
  }

  async function handleSaveSeed() {
    setSavingSeed(true);
    setSeedMessage("");

    try {
      const nextUser = await saveClientSeed(clientSeed);
      setSeedMessage(`Client seed updated to "${nextUser.clientSeed}".`);
    } catch (error) {
      setSeedMessage(error.message);
    } finally {
      setSavingSeed(false);
    }
  }

  function renderMainPanel() {
    if (activeView === "mines") {
      return (
        <MinesGame
          token={token}
          user={user}
          onBalanceChange={updateBalance}
        />
      );
    }

    if (activeView === "dice") {
      return (
        <DiceGame
          token={token}
          user={user}
          onBalanceChange={updateBalance}
        />
      );
    }

    if (activeView !== "lobby") {
      return <PlaceholderPanel title={activeView} onBack={() => setActiveView("lobby")} />;
    }

    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-500 via-blue-300 to-amber-300 p-6 shadow-[0_24px_80px_rgba(59,130,246,0.15)]">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-white/90">Welcome</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
              Free codes, events, updates, and playable games.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-900/80">
              Your lobby is now the first thing you land on after logging in. Jump into Mines or
              Dice from here, keep the casino-style navigation, and expand the other games over time.
            </p>
            <button
              type="button"
              onClick={() => setActiveView("mines")}
              className="mt-6 rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 transition hover:brightness-110"
            >
              Start Playing
            </button>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-white">Games</h3>
            <p className="text-sm text-white/45">Choose a game from the lobby</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {gameCards.map((game) => (
              <motion.button
                key={game.id}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setActiveView(game.id)}
                className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/5 text-left"
              >
                <div className={`flex h-64 items-end bg-gradient-to-br ${game.accent} p-4`}>
                  <span className="text-4xl font-black uppercase tracking-[0.08em] text-white">
                    {game.label}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="font-semibold text-white">{game.label}</p>
                  </div>
                  <p className="text-sm text-white/65">
                    <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    {game.players} playing
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      </motion.div>
    );
  }

  return (
    <div className="grid min-h-[88vh] gap-5 xl:grid-cols-[220px,1fr,300px]">
      <aside className="glass-panel hidden rounded-[2rem] py-6 xl:block">
        <div className="px-6">
          <p className="text-3xl font-black text-white">
            Donut<span className="text-accent">Drop</span>
          </p>
        </div>
        <div className="mt-8 border-t border-white/5 px-3 pt-6">
          <p className="px-3 text-xs uppercase tracking-[0.35em] text-white/35">Games</p>
          <div className="mt-4 space-y-1">
            {sideGames.map((game) => {
              const normalized = game.toLowerCase().replace(/\s+/g, "-");
              const isActive =
                (normalized === "mines" && activeView === "mines") ||
                (normalized === "dice" && activeView === "dice");

              return (
                <button
                  key={game}
                  type="button"
                  onClick={() => setActiveView(normalized)}
                  className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/65 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {game}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      <main className="space-y-5">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-[2rem] px-6 py-5"
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex flex-wrap gap-2 text-sm text-white/55">
                {["Fairness", "Affiliate", "Bonus", "Leaderboard", "Profile", "Store"].map((item) => (
                  <span key={item} className="rounded-xl bg-white/5 px-4 py-2">
                    {item}
                  </span>
                ))}
              </div>
              <h1 className="mt-4 text-3xl font-semibold text-white">
                {activeView === "lobby"
                  ? "Casino lobby with playable games"
                  : `${activeView.charAt(0).toUpperCase() + activeView.slice(1)} table`}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl bg-white/5 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/35">Wallet</p>
                <p className="mt-1 text-2xl font-semibold text-mint">${user.balance?.toFixed(2)}</p>
              </div>
              <button
                type="button"
                className="rounded-2xl bg-emerald-500 px-5 py-4 font-semibold text-slate-950"
              >
                Wallet
              </button>
              <button
                type="button"
                className="rounded-2xl bg-white/5 px-5 py-4 font-medium text-white"
              >
                {user.username}
              </button>
              <button
                type="button"
                onClick={logout}
                className="rounded-2xl border border-white/10 px-5 py-4 text-white/75 transition hover:border-white/25 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </motion.header>

        {renderMainPanel()}

        {(activeView === "mines" || activeView === "dice") && (
          <>
            {seedMessage && <p className="text-sm text-white/60">{seedMessage}</p>}
            <div className="grid gap-5 lg:grid-cols-[320px,1fr]">
              <aside className="space-y-5">
                <section className="glass-panel rounded-[2rem] p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/45">Profile</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">{user.username}</h2>
                  <p className="text-sm text-white/55">{user.email}</p>
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

                <section className="glass-panel rounded-[2rem] p-5">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/45">Provably Fair</p>
                  <h3 className="mt-3 text-lg font-semibold text-white">Client seed control</h3>
                  <input
                    value={clientSeed}
                    onChange={(event) => setClientSeed(event.target.value)}
                    className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-accent"
                    placeholder="Enter client seed"
                  />
                  <button
                    type="button"
                    onClick={handleSaveSeed}
                    disabled={savingSeed}
                    className="mt-3 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-50"
                  >
                    {savingSeed ? "Saving..." : "Save seed"}
                  </button>
                </section>

                <section className="glass-panel rounded-[2rem] p-5">
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

              <FairnessCard
                title="How DonutDrop verifies rounds"
                data={{
                  formula: "SHA256(serverSeed:clientSeed:nonce) generates deterministic game randomness.",
                  input: "Server seed stays hidden until settlement while the client seed remains user-controlled.",
                  nonce: "Nonce increments per bet so every result is unique even when the seed stays the same."
                }}
              />
            </div>
          </>
        )}
      </main>

      <aside className="glass-panel hidden rounded-[2rem] p-4 xl:block">
        <div className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3">
          <p className="font-semibold text-white">Chat</p>
          <p className="text-sm text-white/55">
            <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
            42 online
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-indigo-400/40 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">
            Join our Discord!
          </div>
          {chatMessages.map((message) => (
            <div key={`${message.user}-${message.text}`} className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-sky-300">{message.user}</p>
              <p className="mt-2 text-sm leading-6 text-white/80">{message.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none"
            placeholder="Type a message..."
          />
          <button
            type="button"
            className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Send
          </button>
        </div>
      </aside>
    </div>
  );
}
