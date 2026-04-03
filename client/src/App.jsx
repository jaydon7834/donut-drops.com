import { useAuth } from "./context/AuthContext.jsx";
import { AuthPanel } from "./components/AuthPanel.jsx";
import { Dashboard } from "./components/Dashboard.jsx";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hero-glow px-6 text-white">
        <div className="glass-panel rounded-3xl px-8 py-6 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-accent">DonutRain</p>
          <p className="mt-3 text-lg text-white/70">Loading your vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-glow px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {!user ? (
          <AuthPanel />
        ) : (
          <Dashboard />
        )}
      </div>
    </div>
  );
}
