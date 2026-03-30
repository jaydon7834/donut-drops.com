import { motion } from "framer-motion";

export function GameLayout({
  eyebrow,
  title,
  subtitle,
  controls,
  main,
  side,
  children,
  accent = "from-orange-500/20 via-transparent to-emerald-500/10"
}) {
  return (
    <div className="space-y-5">
      {(eyebrow || title || subtitle) && (
        <motion.aside
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className={`casino-card overflow-hidden rounded-[2rem] bg-gradient-to-br ${accent} p-6`}
        >
          {eyebrow && <p className="text-xs uppercase tracking-[0.35em] text-white/45">{eyebrow}</p>}
          {title && <h2 className="mt-3 text-4xl font-black text-white">{title}</h2>}
          {subtitle && <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">{subtitle}</p>}
        </motion.aside>
      )}

      <div className="grid gap-4 p-1 xl:grid-cols-[250px_1fr_300px]">
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 backdrop-blur rounded-xl p-4"
        >
          {controls}
        </motion.aside>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur rounded-xl p-6 flex justify-center items-center"
        >
          {main || children}
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/5 backdrop-blur rounded-xl p-4"
        >
          {side || <p className="text-gray-400">Chat coming soon</p>}
        </motion.aside>
      </div>
    </div>
  );
}
