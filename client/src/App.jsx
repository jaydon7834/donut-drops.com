import { useAuth } from "./context/AuthContext.jsx";
import { AuthPanel } from "./components/AuthPanel.jsx";
import { Dashboard } from "./components/Dashboard.jsx";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero-glow px-6 text-white">
        <div className="glass-panel rounded-3xl px-8 py-6 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">DonutDrop</p>
          <p className="mt-3 text-lg text-white/70">Loading your vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-glow px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {!user ? (
          <div className="grid min-h-[90vh] items-center gap-10 lg:grid-cols-[1.1fr,0.9fr]">
            <section className="space-y-6">
              <p className="text-sm uppercase tracking-[0.45em] text-accent">DonutDrop</p>
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight sm:text-6xl">
                A sleek casino lab for <span className="text-highlight">Mines</span> and{" "}
                <span className="text-accent">Dice</span>.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-white/65">
                Built for fast play, transparent odds, and seed-level verification. Register, fund
                your wallet, switch games instantly, and inspect every result.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  "JWT-secured sessions",
                  "Live wallet tracking",
                  "Provably fair SHA256 flow"
                ].map((item) => (
                  <div key={item} className="glass-panel rounded-2xl p-4 text-sm text-white/70">
                    {item}
                  </div>
                ))}
              </div>
            </section>
            <AuthPanel />
          </div>
        ) : (
          <Dashboard />
        )}
      </div>
    </div>
  );
}
