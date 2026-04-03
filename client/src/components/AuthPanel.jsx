import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../context/AuthContext.jsx";

const SAVED_LOGIN_KEY = "donutdrop-saved-login";
const initialForms = {
  login: { username: "", password: "" },
  register: { username: "", password: "" }
};

function PasswordField({ value, onChange, showPassword, onToggle, error }) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-white/72">Password</span>
        <button
          type="button"
          onClick={onToggle}
          className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300/80 transition hover:text-orange-200"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      <input
        required
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        className={`w-full rounded-xl border px-4 py-3 text-white transition outline-none ${
          error
            ? "border-rose-400/50 bg-rose-500/10 ring-2 ring-rose-500/40"
            : "border-white/5 bg-[#1e293b] focus:ring-2 focus:ring-orange-500"
        }`}
        placeholder="Enter your password"
      />
      {error ? <p className="mt-2 text-sm text-rose-300">{error}</p> : null}
    </label>
  );
}

export function AuthPanel() {
  const { login, register, error, setError } = useAuth();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForms.login);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || mode !== "login") {
      return;
    }

    try {
      const savedLogin = window.localStorage.getItem(SAVED_LOGIN_KEY);

      if (!savedLogin) {
        return;
      }

      const parsedLogin = JSON.parse(savedLogin);
      setForm({
        username: parsedLogin?.username || "",
        password: parsedLogin?.password || ""
      });
    } catch {
      setForm(initialForms.login);
    }
  }, [mode]);

  const fieldErrors = useMemo(() => {
    if (!error) {
      return {};
    }

    const lowered = error.toLowerCase();
    return {
      username:
        lowered.includes("username") || lowered.includes("account") ? error : "",
      password:
        lowered.includes("password") || lowered.includes("invalid") ? error : ""
    };
  }, [error]);

  function switchMode(nextMode) {
    setMode(nextMode);
    setShowPassword(false);
    setError("");

    if (nextMode === "login" && typeof window !== "undefined") {
      try {
        const parsedLogin = JSON.parse(window.localStorage.getItem(SAVED_LOGIN_KEY) || "{}");
        setForm({
          username: parsedLogin?.username || "",
          password: parsedLogin?.password || ""
        });
        return;
      } catch {
        // fall through to reset
      }
    }

    setForm(initialForms[nextMode]);
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    if (error) {
      setError("");
    }
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
    <div className="flex min-h-screen items-center justify-center bg-[#0b0f1a] px-4 py-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute bottom-[-6rem] right-[-4rem] h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-[0_0_50px_rgba(249,115,22,0.16)] backdrop-blur-xl"
      >
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.42em] text-orange-300/80">
            DonutRain
          </p>
          <h2 className="mt-4 text-3xl font-black text-white">
            {mode === "login" ? "Login to your vault" : "Create your player account"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Fast login, smooth play, and a dark casino-style experience from the first screen.
          </p>
        </div>

        <div className="relative mb-7 grid grid-cols-2 rounded-2xl bg-[#111827] p-1">
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className={`absolute top-1 h-[calc(100%-0.5rem)] w-[calc(50%-0.25rem)] rounded-xl bg-gradient-to-r ${
              mode === "login"
                ? "left-1 from-orange-500 to-amber-400"
                : "left-[calc(50%+0.125rem)] from-emerald-500 to-lime-400"
            }`}
          />
          {["login", "register"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => switchMode(item)}
              className={`relative z-10 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-[0.16em] transition ${
                mode === item ? "text-slate-950" : "text-white/58 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white/72">Username</span>
                <input
                  required
                  value={form.username}
                  onChange={(event) => updateField("username", event.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-white transition outline-none ${
                    fieldErrors.username
                      ? "border-rose-400/50 bg-rose-500/10 ring-2 ring-rose-500/40"
                      : "border-white/5 bg-[#1e293b] focus:ring-2 focus:ring-orange-500"
                  }`}
                  placeholder={mode === "login" ? "Enter username" : "Choose a username"}
                />
                {fieldErrors.username ? (
                  <p className="mt-2 text-sm text-rose-300">{fieldErrors.username}</p>
                ) : null}
              </label>

              <PasswordField
                value={form.password}
                onChange={(event) => updateField("password", event.target.value)}
                showPassword={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
                error={fieldErrors.password}
              />
            </motion.div>
          </AnimatePresence>

          {!fieldErrors.username && !fieldErrors.password && error ? (
            <p className="text-sm text-rose-300">{error}</p>
          ) : null}

          <motion.button
            whileHover={submitting ? undefined : { scale: 1.02 }}
            whileTap={submitting ? undefined : { scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className={`w-full rounded-xl px-4 py-3 font-black uppercase tracking-[0.14em] transition ${
              mode === "login"
                ? "bg-orange-500 text-slate-950 hover:bg-orange-400"
                : "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {submitting ? "Loading..." : mode === "login" ? "Login" : "Register"}
          </motion.button>
        </form>
      </motion.section>
    </div>
  );
}
