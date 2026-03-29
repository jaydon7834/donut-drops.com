export function FairnessCard({ title, data }) {
  if (!data) {
    return null;
  }

  return (
    <section className="glass-panel rounded-3xl p-5">
      <p className="text-xs uppercase tracking-[0.3em] text-white/45">Verification</p>
      <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4 space-y-3 text-sm text-white/70">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="rounded-2xl bg-black/20 p-3">
            <p className="text-xs uppercase tracking-[0.25em] text-white/40">{key}</p>
            <p className="mt-2 break-all font-mono text-xs text-white/80">{String(value)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
