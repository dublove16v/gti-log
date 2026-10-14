import { LOGS, TUNE_TIMELINE, formatDate } from "./lib/service-log";
import TuneLab from "./TuneLab";

type Agg = { n: number; wot: number; boost: number | null; target: number | null; knock: number | null; iat: number | null; rail: number | null; lpfp: number | null };
function agg(ver: string): Agg {
  const ls = LOGS.filter((l) => l.version === ver);
  const w = ls.filter((l) => l.wot);
  const src = w.length ? w : ls;
  const mx = (f: (x: any) => number | null) => { const v = src.map(f).filter((x) => x != null) as number[]; return v.length ? Math.max(...v) : null; };
  const mn = (f: (x: any) => number | null) => { const v = src.map(f).filter((x) => x != null) as number[]; return v.length ? Math.min(...v) : null; };
  return { n: ls.length, wot: w.length, boost: mx((l) => l.maxBoost), target: mx((l) => l.maxTarget), knock: mn((l) => l.worstKnock), iat: mx((l) => l.maxIat), rail: mn((l) => l.minRailWot), lpfp: mx((l) => l.maxLpfp) };
}
const f1 = (v: number | null, u = "") => (v == null ? "—" : `${v.toFixed(1)}${u}`);
const f0 = (v: number | null, u = "") => (v == null ? "—" : `${Math.round(v)}${u}`);

const GLOSS = [
  ["Boost / target", "how hard the turbo pushes air in (psi) vs what the tune asked for"],
  ["Timing pull (knock)", "engine backed off spark to protect itself; more negative is worse"],
  ["IAT", "intake air temp; hotter air knocks sooner"],
  ["Rail pressure", "fuel pressure at the injectors; dropping means the pumps can't keep up"],
  ["LPFP duty", "how hard the in-tank fuel pump is working; near 100% = maxed"],
];


type Series = { label: string; color: string; vals: (number | null)[]; dash?: boolean };
function VerChart({ title, plain, series, unit, vers, band, right }: { title: string; plain: string; series: Series[]; unit: string; vers: string[]; band?: [number, number]; right?: Series }) {
  const W = 560, H = 210, L = 44, R = right ? 44 : 14, T = 14, B = 30;
  const iw = W - L - R, ih = H - T - B;
  const all = series.flatMap((s) => s.vals).filter((v) => v != null) as number[];
  let lo = Math.min(0, ...all), hi = Math.max(...all, 1);
  hi = hi + (hi - lo) * 0.1;
  const x = (i: number) => L + (i / (vers.length - 1)) * iw;
  const y = (v: number) => T + ih - ((v - lo) / (hi - lo)) * ih;
  const yr = (v: number) => T + ih - (v / 100) * ih;
  const path = (vals: (number | null)[], fy: (v: number) => number) => {
    let d = "", pen = false;
    vals.forEach((v, i) => { if (v == null) { pen = false; return; } d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${fy(v).toFixed(1)}`; pen = true; });
    return d;
  };
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
      <div className="font-display text-lg uppercase tracking-wide">{title}</div>
      <div className="text-xs text-muted mb-2">{plain}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {band && <rect x={x(band[0]) - 12} y={T} width={x(band[1]) - x(band[0]) + 24} height={ih} fill="#e23d2b" opacity={0.12} />}
        {band && <text x={(x(band[0]) + x(band[1])) / 2} y={T + 12} textAnchor="middle" fill="#e23d2b" fontSize={10}>stock fuel limit</text>}
        {[0, 0.5, 1].map((f) => { const v = lo + (hi - lo) * f; return (
          <g key={f}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="#2e3338" />
          <text x={L - 6} y={y(v) + 3} textAnchor="end" fill="#9a948a" fontSize={10}>{Math.round(v)}{unit}</text></g>); })}
        {right && [0, 50, 100].map((v) => <text key={v} x={W - R + 6} y={yr(v) + 3} fill={right.color} fontSize={10}>{v}%</text>)}
        {vers.map((v, i) => <text key={v} x={x(i)} y={H - 10} textAnchor="middle" fill="#9a948a" fontSize={9}>{v.replace("V", "")}</text>)}
        {series.map((s) => (
          <g key={s.label}>
            <path d={path(s.vals, y)} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dash ? "5 4" : undefined} />
            {s.vals.map((v, i) => v == null ? null : <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={s.color} />)}
          </g>
        ))}
        {right && <g><path d={path(right.vals, yr)} fill="none" stroke={right.color} strokeWidth={1.5} strokeDasharray="3 3" />
          {right.vals.map((v, i) => v == null ? null : <rect key={i} x={x(i) - 2.5} y={yr(v) - 2.5} width={5} height={5} fill={right.color} />)}</g>}
      </svg>
      <div className="flex flex-wrap gap-3 text-xs mt-1">
        {[...series, ...(right ? [right] : [])].map((s) => <span key={s.label} className="flex items-center gap-1"><span className="inline-block w-3 h-0.5" style={{ background: s.color }} />{s.label}</span>)}
      </div>
    </div>
  );
}

function Strip() {
  const t0 = new Date(TUNE_TIMELINE[0].date).getTime(), t1 = new Date(TUNE_TIMELINE[TUNE_TIMELINE.length - 1].date).getTime();
  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
      <div className="font-display text-lg uppercase tracking-wide">Version timeline</div>
      <div className="text-xs text-muted">Each dot is a new map from John. The long gap is the 2025–26 winter.</div>
      <div className="relative h-16 mt-3 mx-4">
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-border" />
        {TUNE_TIMELINE.map((t, i) => {
          const pct = ((new Date(t.date).getTime() - t0) / (t1 - t0)) * 100;
          return (
            <div key={t.ver} className="absolute -translate-x-1/2 text-center" style={{ left: `${pct}%`, top: i % 2 ? 30 : 0 }}>
              {i % 2 === 0 && <div className="text-[10px] font-display text-accent">{t.ver}</div>}
              <div className={`mx-auto w-2.5 h-2.5 rounded-full ${t.ver === "V2.00" ? "bg-accent" : "bg-ok"}`} style={{ marginTop: i % 2 ? -8 : 2 }} />
              {i % 2 === 1 && <div className="text-[10px] font-display text-accent">{t.ver}</div>}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted mx-4"><span>Apr 2025</span><span>Sep 2026</span></div>
    </div>
  );
}

export default function TuneBay() {
  const rows = TUNE_TIMELINE.map((t) => ({ t, a: agg(t.ver), logs: LOGS.filter((l) => l.version === t.ver) }));
  const vers = rows.map((r) => r.t.ver);
  return (
    <div className="space-y-6">
      <TuneLab />
      <Strip />
      <div className="grid gap-4 lg:grid-cols-2">
        <VerChart title="Peak boost vs target" plain="Boost = how hard the turbo pushes air in. Target = what the tune asked for." unit="" vers={vers}
          series={[{ label: "Peak boost (psi)", color: "#e23d2b", vals: rows.map((r) => r.a.boost) }, { label: "Target (psi)", color: "#9a948a", vals: rows.map((r) => r.a.target), dash: true }]} />
        <VerChart title="Worst knock · timing pull" plain="Engine backed off spark to protect itself. Closer to 0° is better." unit="°" vers={vers}
          series={[{ label: "Worst timing pull (°)", color: "#e6b84d", vals: rows.map((r) => r.a.knock) }]} />
        <VerChart title="Max IAT · intake air temp" plain="Hotter air into the engine makes knock more likely. Summer versions run hotter." unit="°F" vers={vers}
          series={[{ label: "Max IAT (°F)", color: "#5b8def", vals: rows.map((r) => r.a.iat) }]} />
        <VerChart title="Fuel: min rail pressure + LPFP duty" plain="Rail = fuel pressure at the injectors (higher is safer). LPFP duty = how hard the in-tank pump works; near the top means maxed." unit="" vers={vers} band={[6, 7]}
          series={[{ label: "Min rail at full throttle (psi)", color: "#8f9a78", vals: rows.map((r) => r.a.rail) }]}
          right={{ label: "Max LPFP duty (%)", color: "#c07ad6", vals: rows.map((r) => r.a.lpfp) }} />
      </div>
      <p className="text-xs text-muted">From Accessport logs tagged with each version (full-throttle pulls where available). V2.00 has no logs in Drive, so its points are blank.</p>
      <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
        <h2 className="font-display text-2xl uppercase tracking-wide">Version comparison</h2>
        <p className="text-xs text-muted mt-1">Stratified ProTune, Order 52541 (John Degrano). Figures from Accessport logs whose header names that version; WOT (full-throttle) pulls used where available.</p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm">
            <thead className="text-muted text-xs uppercase">
              <tr className="text-left border-b border-border">
                {["Ver","Date","Logs (WOT)","Peak boost","Target","Worst knock","Max IAT","Min rail","Max LPFP"].map((h) => <th key={h} className="py-2 pr-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ t, a }) => (
                <tr key={t.ver} className="border-b border-border/60">
                  <td className="py-1.5 pr-3 font-display text-accent">{t.ver}</td>
                  <td className="pr-3">{formatDate(t.date)}</td>
                  <td className="pr-3">{a.n ? `${a.n} (${a.wot})` : "none"}</td>
                  <td className="pr-3">{f1(a.boost, " psi")}</td>
                  <td className="pr-3">{f1(a.target, " psi")}</td>
                  <td className="pr-3">{a.knock == null ? "—" : `${a.knock}°`}</td>
                  <td className="pr-3">{f0(a.iat, "°F")}</td>
                  <td className="pr-3">{f0(a.rail, " psi")}</td>
                  <td className="pr-3">{f0(a.lpfp, "%")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
          {GLOSS.map(([k, v]) => <div key={k}><dt className="inline font-semibold">{k}</dt> <dd className="inline text-muted">· {v}</dd></div>)}
        </dl>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map(({ t, a, logs }) => (
          <div key={t.ver} className="rounded-[var(--radius)] border border-border bg-surface p-4">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-2xl text-accent">{t.ver}</span>
              <span className="text-xs text-muted">{formatDate(t.date)}</span>
            </div>
            <dl className="mt-2 space-y-1.5 text-sm">
              <div><dt className="text-xs uppercase text-muted">What John changed</dt><dd>{t.change}</dd></div>
              <div><dt className="text-xs uppercase text-muted">Why</dt><dd>{t.why}</dd></div>
              <div><dt className="text-xs uppercase text-muted">Outcome</dt><dd>{t.outcome}</dd></div>
              {t.note && <div className="text-xs text-muted">{t.note}</div>}
            </dl>
            <table className="w-full text-xs mt-3">
              <thead className="text-muted"><tr className="text-left border-b border-border"><th className="py-1">Log</th><th>Boost / tgt</th><th>Knock</th><th>IAT</th><th>Rail</th><th>LPFP</th></tr></thead>
              <tbody>
                {logs.length === 0 && <tr><td colSpan={6} className="py-2 text-muted">No logs on this version in Drive.</td></tr>}
                {logs.slice(0, 8).map((l) => (
                  <tr key={l.id} className="border-b border-border/40">
                    <td className="py-1 pr-2">{l.date.slice(5)} {l.name}{l.wot ? "" : " ·cruise"}</td>
                    <td>{f1(l.maxBoost)} / {f1(l.maxTarget)}</td>
                    <td>{l.worstKnock ?? "—"}°</td>
                    <td>{f0(l.maxIat)}</td>
                    <td>{f0(l.minRailWot)}</td>
                    <td>{f0(l.maxLpfp)}%</td>
                  </tr>
                ))}
                {logs.length > 8 && <tr><td colSpan={6} className="py-1 text-muted">+{logs.length - 8} more in the Logs tab</td></tr>}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
