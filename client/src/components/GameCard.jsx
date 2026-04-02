import { motion } from "framer-motion";

export function GameCard({ title, players, image, accent, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.985 }}
      type="button"
      onClick={onClick}
      className="relative group aspect-[0.78] w-full cursor-pointer overflow-hidden rounded-[1.15rem] border border-white/10 bg-[#131722] text-left shadow-[0_20px_60px_rgba(0,0,0,0.28)]"
    >
      <div className="absolute inset-0">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.08]"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,10,20,0.04)_0%,rgba(4,10,20,0.18)_32%,rgba(4,10,20,0.84)_78%,rgba(4,10,20,0.96)_100%)] transition duration-300 group-hover:bg-[linear-gradient(180deg,rgba(4,10,20,0.03)_0%,rgba(4,10,20,0.14)_30%,rgba(4,10,20,0.76)_76%,rgba(4,10,20,0.93)_100%)]" />
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-25 transition duration-300 group-hover:opacity-35`} />
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <div className="rounded-[1rem] border border-white/10 bg-black/30 px-3 py-3 backdrop-blur-md">
          <div className="font-black text-[1.38rem] leading-none tracking-[-0.03em] text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.5)] sm:text-[1.55rem]">
            {title}
          </div>
          <div className="mt-2 text-xs text-white/78 sm:text-sm">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-emerald-400" />
          {players} online
          </div>
        </div>
      </div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 shadow-[0_0_30px_rgba(255,140,0,0.6)] transition" />
    </motion.button>
  );
}
