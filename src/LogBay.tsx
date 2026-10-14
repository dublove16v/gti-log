import { useMemo, useState } from "react";
import { LOGS, LogSummary, formatDate } from "./lib/service-log";

function Chart({ log }: { log: LogSummary }) {
  const pts = log.chart.filter((p) => p.t != null);
  if (pts.length < 2) return <div className="text-sm text-muted p-4">Not enough samples.</div>;
  const W = 640, H = 220, pad = { l: 40, r: 16, t: 16, b: 28 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const t0 = pts[0].t!, t1 = pts[pts.length - 1].t! || 1;
  const ymax = Math.max(30, ...pts.flatMap((p) => [p.boost ?? 0, p.trgt ?? 0, (p.iat ?? 0) / 5, Math.abs(p.knock ?? 0) * 4]));
  const x = (t: number) => pad.l + ((t - t0) / (t1 - t0 || 1)) * iw;
  const y = (v: number) => pad.t + ih - (v / ymax) * ih;
  const path = (key: "boost" | "trgt" | "iat" | "knock", scale = 1) =>
    pts
      .filter((p) => p[key] != null)
      .map((p, i) => `${i ? "L" : "M"}${x(p.t!).toFixed(1)},${y((key === "knock" ? Math.abs(p.knock!) : (p[key] as number)) * scale).toFixed(1)}`)
      .join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-bg rounded-md border border-border">
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}>
          <line x1={pad.l} x2={W - pad.r} y1={y(ymax * f)} y2={y(ymax * f)} stroke="#2e3338" strokeWidth={1} />
          <text x={pad.l - 6} y={y(ymax * f) + 3} textAnchor="end" fill="#9a948a" fontSize={10}>{(ymax * f).toFixed(0)}</text>
        </g>
      ))}
      <path d={path("trgt")} fill="none" stroke="#9a948a" strokeWidth={1.5} strokeDasharray="4 3" />
      <path d={path("boost")} fill="none" stroke="#e23d2b" strokeWidth={2} />
      <path d={path("iat", 1 / 5)} fill="none" stroke="#5b8def" strokeWidth={1.25} />
      <path d={path("knock", 4)} fill="none" stroke="#e6b84d" strokeWidth={1.25} />
      <text x={pad.l} y={H - 8} fill="#9a948a" fontSize={10}>0s</text>
      <text x={W - pad.r} y={H - 8} textAnchor="end" fill="#9a948a" fontSize={10}>{log.durationSec}s</text>
      <g transform={`translate(${pad.l + 8},${pad.t + 12})`} fontSize={11}>
        <circle cx={0} cy={0} r={3} fill="#e23d2b" /><text x={8} y={3} fill="#f3efe7">Boost</text>
        <circle cx={70} cy={0} r={3} fill="#9a948a" /><text x={78} y={3} fill="#f3efe7">Target</text>
        <circle cx={145} cy={0} r={3} fill="#5b8def" /><text x={153} y={3} fill="#f3efe7">IAT ÷5</text>
        <circle cx={220} cy={0} r={3} fill="#e6b84d" /><text x={228} y={3} fill="#f3efe7">|Knock|×4</text>
      </g>
    </svg>
  );
}

function FuelChart({ log }: { log: LogSummary }) {
  const pts = log.chart.filter((p) => p.t != null && (p.rail != null || p.lpfp != null));
  if (pts.length < 2) return null;
  const W = 640, H = 160, pad = { l: 40, r: 40, t: 12, b: 24 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const t0 = pts[0].t!, t1 = pts[pts.length - 1].t! || 1;
  const rmax = Math.max(2000, ...pts.map((p) => p.rail ?? 0));
  const x = (t: number) => pad.l + ((t - t0) / (t1 - t0 || 1)) * iw;
  const yr = (v: number) => pad.t + ih - (v / rmax) * ih;
  const yl = (v: number) => pad.t + ih - (v / 100) * ih;
  const rail = pts.filter((p) => p.rail != null).map((p, i) => `${i ? "L" : "M"}${x(p.t!).toFixed(1)},${yr(p.rail!).toFixed(1)}`).join(" ");
  const lpfp = pts.filter((p) => p.lpfp != null).map((p, i) => `${i ? "L" : "M"}${x(p.t!).toFixed(1)},${yl(p.lpfp!).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-bg rounded-md border border-border mt-2">
      <path d={rail} fill="none" stroke="#8f9a78" strokeWidth={2} />
      <path d={lpfp} fill="none" stroke="#c07ad6" strokeWidth={1.5} />
      <text x={pad.l} y={pad.t + 10} fill="#8f9a78" fontSize={11}>Rail psi (left)</text>
      <text x={W - pad.r} y={pad.t + 10} textAnchor="end" fill="#c07ad6" fontSize={11}>LPFP % (right)</text>
      <text x={pad.l - 6} y={yr(0) + 3} textAnchor="end" fill="#9a948a" fontSize={10}>0</text>
      <text x={pad.l - 6} y={yr(rmax) + 3} textAnchor="end" fill="#9a948a" fontSize={10}>{Math.round(rmax)}</text>
    </svg>
  );
}

export default function LogBay() {
  const versions = useMemo(() => {
    const s = new Set(LOGS.map((l) => l.version).filter(Boolean) as string[]);
    return ["all", ...Array.from(s).sort()];
  }, []);
  const [ver, setVer] = useState("all");
  const [wotOnly, setWotOnly] = useState(true);
  const [sel, setSel] = useState<string | null>(null);

  const list = useMemo(() => {
    let xs = [...LOGS];
    if (ver !== "all") xs = xs.filter((l) => l.version === ver);
    if (wotOnly) xs = xs.filter((l) => l.wot);
    return xs.sort((a, b) => b.date.localeCompare(a.date) || b.name.localeCompare(a.name));
  }, [ver, wotOnly]);

  const active = LOGS.find((l) => l.id === (sel ?? list[0]?.id)) ?? list[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="rounded-[var(--radius)] border border-border bg-surface overflow-hidden">
        <div className="p-3 border-b border-border flex flex-wrap gap-2 items-center">
          <select value={ver} onChange={(e) => setVer(e.target.value)} className="bg-surface-2 border border-border rounded-md px-2 py-1 text-sm">
            {versions.map((v) => <option key={v} value={v}>{v === "all" ? "All tunes" : v}</option>)}
          </select>
          <label className="text-xs text-muted flex items-center gap-1.5">
            <input type="checkbox" checked={wotOnly} onChange={(e) => setWotOnly(e.target.checked)} />
            WOT pulls only
          </label>
        </div>
        <ul className="max-h-[70vh] overflow-auto divide-y divide-border">
          {list.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => setSel(l.id)}
                className={`w-full text-left px-3 py-2.5 hover:bg-surface-2 ${active?.id === l.id ? "bg-surface-2" : ""}`}>
                <div className="flex justify-between gap-2">
                  <span className="text-sm font-medium truncate">{l.name}</span>
                  <span className="text-xs text-accent font-display">{l.version}</span>
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {formatDate(l.date)}
                  {l.maxBoost != null && <> · {l.maxBoost.toFixed(1)} psi</>}
                  {l.worstKnock != null && l.worstKnock < 0 && <> · knock {l.worstKnock}°</>}
                </div>
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="p-4 text-sm text-muted">No logs match.</li>}
        </ul>
      </div>

      {active && (
        <div className="rounded-[var(--radius)] border border-border bg-surface p-4 space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl uppercase tracking-wide">{active.name}</h2>
            <span className="text-sm text-muted">{formatDate(active.date)} · {active.version} · {active.mileage?.toLocaleString() ?? "—"} mi</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-sm">
            {[
              ["Max boost", active.maxBoost != null ? `${active.maxBoost.toFixed(1)} psi` : "—"],
              ["Target", active.maxTarget != null ? `${active.maxTarget.toFixed(1)} psi` : "—"],
              ["Worst knock", active.worstKnock != null ? `${active.worstKnock}°` : "—"],
              ["Min rail (WOT)", active.minRailWot != null ? `${Math.round(active.minRailWot)} psi` : "—"],
              ["Max LPFP", active.maxLpfp != null ? `${active.maxLpfp.toFixed(0)}%` : "—"],
              ["Max IAT", active.maxIat != null ? `${active.maxIat}°F` : "—"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md bg-bg border border-border px-2.5 py-2">
                <div className="text-[10px] uppercase tracking-wider text-muted">{k}</div>
                <div className="font-semibold mt-0.5">{v}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted">
            Boost actual vs target (psi). Knock is timing pulled by the ECU when it hears detonation — more negative is worse.
            IAT is intake-air temp (scaled ÷5 so it fits). Rail / LPFP show how hard the fuel system is working.
          </p>
          <Chart log={active} />
          <FuelChart log={active} />
        </div>
      )}
    </div>
  );
}
