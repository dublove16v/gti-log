import { useMemo, useState } from "react";
import { Job, ZONES, TUNE_TIMELINE, formatDate, money } from "./lib/service-log";

/** Dot positions as % of the elevation image (car faces left). */
const DOTS: Record<string, { x: number; y: number }> = {
  intake:   { x: 18, y: 38 },
  manifold: { x: 28, y: 42 },
  turbo:    { x: 24, y: 58 },
  fuel:     { x: 62, y: 62 },
  chassis:  { x: 48, y: 72 },
  brakes:   { x: 22, y: 78 },
  exhaust:  { x: 88, y: 78 },
  cabin:    { x: 55, y: 32 },
};

type Props = { jobs: Job[]; onPickJob: (j: Job) => void };

export default function CarBay({ jobs, onPickJob }: Props) {
  const [zone, setZone] = useState<string>("manifold");
  const z = ZONES.find((z) => z.id === zone)!;
  const zoneJobs = useMemo(
    () => jobs.filter((j) => j.zone === zone || j.category === zone).sort((a, b) => b.date.localeCompare(a.date)),
    [jobs, zone]
  );
  const spent = zoneJobs.reduce((s, j) => s + (j.cost ?? 0), 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-[var(--radius)] border border-border bg-surface p-3 sm:p-4">
        <div className="relative w-full select-none">
          <img src="./gti-elevation.png" alt="2011 GTI side elevation" className="w-full h-auto block" />
          {ZONES.map((zn, i) => {
            const p = DOTS[zn.id];
            const active = zn.id === zone;
            return (
              <button
                key={zn.id}
                type="button"
                onClick={() => setZone(zn.id)}
                title={zn.label}
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border-2 text-[11px] font-display font-bold transition
                  ${active ? "bg-accent border-accent text-accent-fg scale-110 shadow-[0_0_0_4px_rgba(226,61,43,0.25)]" : "bg-surface-2 border-fg/40 text-fg hover:border-accent"}`}
                style={{ left: `${p.x}%`, top: `${p.y}%`, width: 28, height: 28 }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {ZONES.map((zn, i) => (
            <button
              key={zn.id}
              type="button"
              onClick={() => setZone(zn.id)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium border ${zn.id === zone ? "bg-accent border-accent text-accent-fg" : "border-border text-muted hover:text-fg"}`}
            >
              {i + 1}. {zn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
          <div className="font-display text-2xl tracking-wide uppercase text-fg">{z.label}</div>
          <div className="text-sm text-muted mt-0.5">{z.short}</div>
          <p className="mt-3 text-sm leading-relaxed text-fg/90">{z.summary}</p>
          <div className="mt-3 flex gap-4 text-sm">
            <div><span className="text-muted">Jobs </span><span className="font-semibold">{zoneJobs.length}</span></div>
            <div><span className="text-muted">Spent </span><span className="font-semibold">{money(spent)}</span></div>
          </div>
        </div>

        <div className="rounded-[var(--radius)] border border-border bg-surface overflow-hidden flex-1">
          <div className="px-4 py-2 border-b border-border text-xs uppercase tracking-wider text-muted font-display">Zone jobs</div>
          <ul className="max-h-72 overflow-auto divide-y divide-border">
            {zoneJobs.length === 0 && <li className="px-4 py-6 text-sm text-muted">No jobs tagged to this zone yet.</li>}
            {zoneJobs.map((j) => (
              <li key={j.id}>
                <button type="button" onClick={() => onPickJob(j)} className="w-full text-left px-4 py-2.5 hover:bg-surface-2 transition">
                  <div className="flex justify-between gap-2">
                    <span className="text-sm font-medium">{j.title}</span>
                    <span className="text-sm text-muted shrink-0">{money(j.cost)}</span>
                  </div>
                  <div className="text-xs text-muted mt-0.5">{formatDate(j.date)} · {j.vendor}{j.orderRef ? ` · ${j.orderRef}` : ""}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="lg:col-span-2 rounded-[var(--radius)] border border-border bg-surface p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <h2 className="font-display text-xl uppercase tracking-wide">Stratified ProTune timeline</h2>
          <span className="text-xs text-muted">Order 52541 · John Degrano</span>
        </div>
        <p className="text-sm text-muted mb-4">
          V2.00 is on the car. Safer than V1.90, not stronger. The low-pressure pump is still the limit.
        </p>
        <ol className="relative border-l border-border ml-2 space-y-4">
          {TUNE_TIMELINE.map((t) => (
            <li key={t.ver} className="pl-5 relative">
              <span className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${t.ver === "V2.00" ? "bg-accent" : "bg-ok"}`} />
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <span className="font-display text-lg text-accent">{t.ver}</span>
                <span className="text-xs text-muted">{formatDate(t.date)}</span>
              </div>
              <p className="text-sm leading-relaxed mt-0.5">{t.change} {t.outcome}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
