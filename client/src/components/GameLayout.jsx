import { motion } from "framer-motion";

export function GameLayout({
  eyebrow,
  title,
  subtitle,
  controls,
  main,
  rightPanel,
  children,
  accent = "from-orange-500/20 via-transparent to-emerald-500/10",
  controlsClassName = "w-full shrink-0 rounded-xl bg-white/5 p-4 backdrop-blur xl:w-[220px]",
  mainClassName = "min-w-0 flex-1 overflow-hidden rounded-xl bg-white/5 p-4 backdrop-blur xl:p-6",
  rightPanelClassName = "w-full shrink-0 rounded-xl bg-white/5 p-4 backdrop-blur xl:w-[300px]"
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

      <div className="flex w-full min-w-0 flex-col gap-4 p-1 xl:flex-row xl:gap-6">
        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className={controlsClassName}
        >
          {controls}
        </motion.aside>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={mainClassName}
        >
          {main || children}
        </motion.section>

        {rightPanel ? (
          <motion.aside
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className={rightPanelClassName}
          >
            {rightPanel}
          </motion.aside>
        ) : null}
      </div>
    </div>
  );
}
