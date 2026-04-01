import { motion } from "framer-motion";

export function GameCard({ title, players, image, accent, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.985 }}
      type="button"
      onClick={onClick}
      className="relative group cursor-pointer rounded-xl overflow-hidden border border-white/10 bg-[#131722] text-left shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
    >
      <div className="flex h-44 w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_48%),linear-gradient(180deg,rgba(15,23,42,0.22),rgba(15,23,42,0.6))] p-3">
        <img
          src={image}
          alt={title}
          className="h-full w-full rounded-lg object-contain transition duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition" />
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-15 group-hover:opacity-25 transition`} />
      <div className="absolute bottom-2 left-2 text-white">
        <div className="font-bold text-lg">{title}</div>
        <div className="mt-1 text-xs text-white/75">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
          {players} online
        </div>
      </div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 shadow-[0_0_30px_rgba(255,140,0,0.6)] transition" />
    </motion.button>
  );
}
