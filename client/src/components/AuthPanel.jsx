import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";

const SAVED_LOGIN_KEY = "donutdrop-saved-login";
const initialForms = {
  login: { username: "", password: "" },
  register: { username: "", email: "", password: "" }
};

export function AuthPanel() {
  const { login, register, error, setError } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForms.login);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const savedLogin = window.localStorage.getItem(SAVED_LOGIN_KEY);

      if (!savedLogin) {
        return;
      }

      const parsedLogin = JSON.parse(savedLogin);

      if (parsedLogin?.username || parsedLogin?.password) {
        setForm((current) =>
          mode === "login"
            ? {
                ...current,
                username: parsedLogin.username || "",
                password: parsedLogin.password || ""
              }
            : current
        );
      }
    } catch {
      // Ignore malformed saved login state and keep the form usable.
    }
  }, [mode]);

  function switchMode(nextMode) {
    setMode(nextMode);
    if (nextMode === "login") {
      try {
        const savedLogin =
          typeof window !== "undefined" ? window.localStorage.getItem(SAVED_LOGIN_KEY) : null;
        const parsedLogin = savedLogin ? JSON.parse(savedLogin) : null;

        setForm({
          ...initialForms.login,
          username: parsedLogin?.username || "",
          password: parsedLogin?.password || ""
        });
      } catch {
        setForm(initialForms.login);
      }
    } else {
      setForm(initialForms[nextMode]);
    }
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(form);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            SAVED_LOGIN_KEY,
            JSON.stringify({
              username: form.username,
              password: form.password
            })
          );
        }
      } else {
        await register(form);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel mx-auto w-full max-w-md rounded-3xl p-8 shadow-neon"
    >
      <div className="mb-6 flex gap-2 rounded-full bg-white/5 p-1">
        {["login", "register"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => switchMode(item)}
            className={`flex-1 rounded-full px-4 py-2 text-sm capitalize transition ${
              mode === item ? "bg-accent text-black" : "text-white/70 hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <h2 className="text-3xl font-semibold text-white">
        {mode === "login" ? "Back for another run?" : "Create your DonutDrop vault"}
      </h2>
      <p className="mt-2 text-sm text-white/60">
        Track your balance, swap games instantly, and verify every result with a provably fair
        trail.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {mode === "register" && (
          <label className="block">
            <span className="mb-2 block text-sm text-white/70">Username</span>
            <input
              required
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-accent"
              placeholder="donutking"
            />
          </label>
        )}

        <label className="block">
            <span className="mb-2 block text-sm text-white/70">
              {mode === "login" ? "Username" : "Email"}
            </span>
            <input
              required
            type={mode === "login" ? "text" : "email"}
            value={mode === "login" ? form.username : form.email}
            onChange={(event) =>
              setForm({
                ...form,
                [mode === "login" ? "username" : "email"]: event.target.value
              })
            }
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-accent"
              placeholder={mode === "login" ? "donutking" : "player@donutdrop.gg"}
            />
          </label>

        <label className="block">
          <span className="mb-2 block text-sm text-white/70">Password</span>
          <input
            required
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-accent"
              placeholder="********"
          />
        </label>

        {error && <p className="rounded-2xl bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Processing..." : mode === "login" ? "Login" : "Register"}
        </button>
      </form>
    </motion.section>
  );
}
