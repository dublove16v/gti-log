import { useEffect, useMemo, useState } from "react";
import { TUNE_TIMELINE, LOGS } from "./lib/service-log";

type Cols = Record<string, (number | null)[]>;
type Sample = { id: string; ver: string | null; c: Cols };

const RPM_BINS = Array.from({ length: 16 }, (_, i) => i * 500); // 0..7500
const PSI_BINS = Array.from({ length: 14 }, (_, i) => i * 2); // 0..26+
const CHANNELS: { id: string; label: string; plain: string; unit: string; agg: "mean" | "min"; good: "high" | "low" | "zero"; dp: number }[] = [
  { id: "boost", label: "Boost actual", plain: "how hard the turbo pushes air in", unit: "psi", agg: "mean", good: "low", dp: 1 },
  { id: "berr", label: "Boost error", plain: "actual minus target; + is overboost, − is underboost", unit: "psi", agg: "mean", good: "zero", dp: 1 },
  { id: "timing", label: "Ignition timing", plain: "spark advance; more is more power, if no knock", unit: "°", agg: "mean", good: "high", dp: 1 },
  { id: "knock", label: "Timing pull (knock)", plain: "engine backed off spark to protect itself; worst in cell", unit: "°", agg: "min", good: "high", dp: 2 },
  { id: "afr", label: "AFR", plain: "air-fuel ratio; ~11.5–12 is a safe rich target under boost", unit: "", agg: "mean", good: "low", dp: 2 },
  { id: "rail", label: "Rail pressure", plain: "fuel pressure at the injectors; low = pumps can't keep up", unit: "psi", agg: "mean", good: "high", dp: 0 },
  { id: "lpfp", label: "LPFP duty", plain: "how hard the in-tank pump works; near max = out of fuel headroom", unit: "%", agg: "mean", good: "low", dp: 0 },
];

type Cell = { v: number | null; n: number };
function binTable(samples: Sample[], ch: string, agg: "mean" | "min"): Cell[][] {
  const acc = RPM_BINS.map(() => PSI_BINS.map(() => ({ s: 0, n: 0, m: Infinity })));
  for (const sm of samples) {
    const c = sm.c, rpm = c.rpm, boost = c.boost;
    if (!rpm || !boost) continue;
    for (let i = 0; i < rpm.length; i++) {
      const r = rpm[i], b = boost[i];
      if (r == null || b == null) continue;
      let v: number | null = null;
      if (ch === "berr") { const t = c.trgt?.[i]; v = t == null ? null : b - t; }
      else v = c[ch]?.[i] ?? null;
      if (v == null) continue;
      const ri = Math.min(RPM_BINS.length - 1, Math.floor(r / 500));
      const ci = Math.min(PSI_BINS.length - 1, Math.max(0, Math.floor(b / 2)));
      const a = acc[ri][ci]; a.s += v; a.n++; a.m = Math.min(a.m, v);
    }
  }
  return acc.map((row) => row.map((a) => ({ v: a.n ? (agg === "min" ? a.m : a.s / a.n) : null, n: a.n })));
}

function heat(t: number) { // 0 green -> 1 red
  const stops = [[60, 170, 90], [230, 210, 70], [235, 140, 50], [226, 61, 43]];
  const x = Math.max(0, Math.min(1, t)) * 3, i = Math.min(2, Math.floor(x)), f = x - i;
  const c = stops[i].map((s, k) => Math.round(s + (stops[i + 1][k] - s) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function useScale(table: Cell[][], good: string, diff: boolean) {
  const vals = table.flat().map((c) => c.v).filter((v) => v != null) as number[];
  const lo = Math.min(...vals), hi = Math.max(...vals);
  return (v: number) => {
    if (diff || good === "zero") { const m = Math.max(Math.abs(lo), Math.abs(hi), 0.01); return Math.abs(v) / m; }
    const t = hi === lo ? 0 : (v - lo) / (hi - lo);
    return good === "high" ? 1 - t : t;
  };
}

function Surface({ table, color }: { table: Cell[][]; color: (v: number) => string }) {
  const vals = table.flat().map((c) => c.v).filter((v) => v != null) as number[];
  if (!vals.length) return <div className="text-sm text-muted p-6">No data.</div>;
  const lo = Math.min(...vals), hi = Math.max(...vals), rng = hi - lo || 1;
  const W = 620, H = 380, sx = 24, sy = 22, zh = 170;
  const R = table.length, C = table[0].length;
  const P = (r: number, c: number, v: number) => ({ x: W / 2 + (c - r) * sx * 0.95, y: 10 + (c + r) * sy * 0.5 + zh - ((v - lo) / rng) * zh });
  const quads: { d: string; z: number; fill: string }[] = [];
  for (let r = 0; r < R - 1; r++) for (let c = 0; c < C - 1; c++) {
    const cs = [table[r][c], table[r][c + 1], table[r + 1][c + 1], table[r + 1][c]];
    if (cs.some((x) => x.v == null)) continue;
    const pts = [P(r, c, cs[0].v!), P(r, c + 1, cs[1].v!), P(r + 1, c + 1, cs[2].v!), P(r + 1, c, cs[3].v!)];
    const avg = cs.reduce((s, x) => s + x.v!, 0) / 4;
    quads.push({ d: "M" + pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join("L") + "Z", z: r + c, fill: color(avg) });
  }
  quads.sort((a, b) => a.z - b.z);
  const base = (r: number, c: number) => P(r, c, lo);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <path d={`M${base(0,0).x},${base(0,0).y}L${base(0,C-1).x},${base(0,C-1).y}L${base(R-1,C-1).x},${base(R-1,C-1).y}L${base(R-1,0).x},${base(R-1,0).y}Z`} fill="none" stroke="#2e3338" />
      {quads.map((q, i) => <path key={i} d={q.d} fill={q.fill} stroke="#121416" strokeWidth={0.6} opacity={0.95} />)}
      <text x={base(0, C - 1).x + 6} y={base(0, C - 1).y + 14} fill="#9a948a" fontSize={11}>boost psi →</text>
      <text x={base(R - 1, 0).x - 6} y={base(R - 1, 0).y + 14} textAnchor="end" fill="#9a948a" fontSize={11}>← RPM</text>
    </svg>
  );
}

function Gauge({ label, v, min, max, unit, warn }: { label: string; v: number | null; min: number; max: number; unit: string; warn?: number }) {
  const a0 = -225, a1 = 45, R = 54, cx = 70, cy = 70;
  const ang = (x: number) => (a0 + ((Math.max(min, Math.min(max, x)) - min) / (max - min)) * (a1 - a0)) * Math.PI / 180;
  const pt = (a: number, r: number) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  const ticks = Array.from({ length: 11 }, (_, i) => min + ((max - min) * i) / 10);
  return (
    <svg viewBox="0 0 140 130" className="w-full">
      <circle cx={cx} cy={cy} r={62} fill="#0d0f11" stroke="#2e3338" strokeWidth={3} />
      <path d={`M${pt(ang(min), R)} A${R},${R} 0 1 1 ${pt(ang(max), R)}`} fill="none" stroke="#2e3338" strokeWidth={4} />
      {warn != null && <path d={`M${pt(ang(warn), R)} A${R},${R} 0 0 1 ${pt(ang(max), R)}`} fill="none" stroke="#e23d2b" strokeWidth={4} />}
      {ticks.map((t, i) => <line key={i} x1={pt(ang(t), R - 7).split(",")[0]} y1={pt(ang(t), R - 7).split(",")[1]} x2={pt(ang(t), R).split(",")[0]} y2={pt(ang(t), R).split(",")[1]} stroke="#9a948a" />)}
      {v != null && <line x1={cx} y1={cy} x2={pt(ang(v), R - 6).split(",")[0]} y2={pt(ang(v), R - 6).split(",")[1]} stroke="#e23d2b" strokeWidth={2.5} />}
      <circle cx={cx} cy={cy} r={4} fill="#e23d2b" />
      <text x={cx} y={cy + 24} textAnchor="middle" fill="#f3efe7" fontSize={15} fontWeight={600}>{v == null ? "—" : v.toFixed(unit === "rpm" ? 0 : 1)}</text>
      <text x={cx} y={cy + 36} textAnchor="middle" fill="#9a948a" fontSize={9}>{label} {unit}</text>
    </svg>
  );
}
function Bar({ label, v, min, max, unit }: { label: string; v: number | null; min: number; max: number; unit: string }) {
  const p = v == null ? 0 : Math.max(0, Math.min(1, (v - min) / (max - min)));
  return (
    <div className="text-xs">
      <div className="flex justify-between text-muted"><span>{label}</span><span className="text-fg">{v == null ? "—" : `${Math.round(v)}${unit}`}</span></div>
      <div className="h-2.5 rounded bg-bg border border-border mt-1 overflow-hidden"><div className="h-full" style={{ width: `${p * 100}%`, background: heat(p) }} /></div>
    </div>
  );
}

export default function TuneLab() {
  const [samples, setSamples] = useState<Sample[] | null>(null);
  useEffect(() => { import("./data/samples.json").then((m) => setSamples(m.default as Sample[])); }, []);
  const vers = TUNE_TIMELINE.map((t) => t.ver);
  const [ver, setVer] = useState("V1.90");
  const [cmp, setCmp] = useState("");
  const [ch, setCh] = useState("boost");
  const [rpmRow, setRpmRow] = useState(9);
  const [hover, setHover] = useState<string>("");
  const chan = CHANNELS.find((c) => c.id === ch)!;

  const tA = useMemo(() => samples ? binTable(samples.filter((s) => s.ver === ver), ch, chan.agg) : null, [samples, ver, ch]);
  const tB = useMemo(() => samples && cmp ? binTable(samples.filter((s) => s.ver === cmp), ch, chan.agg) : null, [samples, cmp, ch]);
  const table = useMemo(() => {
    if (!tA) return null;
    if (!tB) return tA;
    return tA.map((row, r) => row.map((c, k) => ({ v: c.v != null && tB[r][k].v != null ? c.v - tB[r][k].v! : null, n: Math.min(c.n, tB[r][k].n) })));
  }, [tA, tB]);
  const diff = !!tB;
  const scale = useScale(table ?? [[{ v: 0, n: 0 }]], chan.good, diff);
  const col = (v: number) => heat(scale(v));

  const verLogs = useMemo(() => samples ? samples.filter((s) => s.ver === ver) : [], [samples, ver]);
  const [logId, setLogId] = useState("");
  const log = verLogs.find((l) => l.id === logId) ?? verLogs.find((l) => LOGS.find((x) => x.id === l.id)?.wot) ?? verLogs[0];
  const [pos, setPos] = useState(0);
  useEffect(() => setPos(0), [log?.id]);
  const len = log?.c.rpm?.length ?? 0;
  const at = (k: string) => log?.c[k]?.[Math.min(pos, len - 1)] ?? null;

  if (!samples || !table) return <div className="text-sm text-muted p-6">Loading log tables…</div>;
  const has = (k: string) => verLogs.some((s) => s.c[k]?.some((v) => v != null));
  const noData = !table.flat().some((c) => c.v != null);

  // trace chart
  const trace = () => {
    if (!log || len < 2) return null;
    const W = 640, H = 170, L = 30, T = 10, B = 18, iw = W - L - 10, ih = H - T - B;
    const x = (i: number) => L + (i / (len - 1)) * iw;
    const line = (k: string, lo: number, hi: number) => (log.c[k] ?? []).map((v, i) => v == null ? "" : `${i ? "L" : "M"}${x(i).toFixed(1)},${(T + ih - ((v - lo) / (hi - lo)) * ih).toFixed(1)}`).join("");
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-bg rounded-md border border-border">
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={L} x2={W - 10} y1={T + ih * f} y2={T + ih * f} stroke="#23272c" />)}
        <path d={line("rpm", 0, 7500)} fill="none" stroke="#f3efe7" strokeWidth={1.2} opacity={0.7} />
        <path d={line("trgt", 0, 35)} fill="none" stroke="#9a948a" strokeDasharray="4 3" strokeWidth={1.2} />
        <path d={line("boost", 0, 35)} fill="none" stroke="#e23d2b" strokeWidth={1.8} />
        <path d={line("timing", -10, 30)} fill="none" stroke="#5b8def" strokeWidth={1.2} />
        <path d={line("lpfp", 0, 100)} fill="none" stroke="#c07ad6" strokeWidth={1.2} />
        <line x1={x(pos)} x2={x(pos)} y1={T} y2={T + ih} stroke="#e6b84d" strokeWidth={1.5} />
        <g fontSize={10} transform={`translate(${L + 4},${H - 4})`}>
          {[["RPM", "#f3efe7"], ["Boost", "#e23d2b"], ["Target", "#9a948a"], ["Timing", "#5b8def"], ["LPFP %", "#c07ad6"]].map(([t, c], i) => <text key={t} x={i * 70} fill={c}>{t}</text>)}
        </g>
      </svg>
    );
  };

  const slice = table[rpmRow];
  const sliceVals = slice.map((c) => c.v).filter((v) => v != null) as number[];
  const sMax = Math.max(...sliceVals.map(Math.abs), 0.01);

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius)] border border-accent/40 bg-surface p-3 text-xs text-muted">
        <span className="text-accent font-semibold">Logged tables — from your logs, not the tune file.</span> We don't have Stratified's map files.
        Each cell averages every Accessport sample that landed at that RPM (row) and boost (column) on the chosen version. Empty cell = the car never logged there.
      </div>

      <div className="flex flex-wrap gap-2 items-center text-sm">
        <label className="text-muted">Version</label>
        <select value={ver} onChange={(e) => setVer(e.target.value)} className="bg-surface border border-border rounded-md px-2 py-1">{vers.map((v) => <option key={v}>{v}</option>)}</select>
        <label className="text-muted ml-2">Compare to</label>
        <select value={cmp} onChange={(e) => setCmp(e.target.value)} className="bg-surface border border-border rounded-md px-2 py-1">
          <option value="">— none —</option>{vers.filter((v) => v !== ver).map((v) => <option key={v}>{v}</option>)}
        </select>
        <div className="flex flex-wrap gap-1 ml-2">
          {CHANNELS.map((c) => (
            <button key={c.id} type="button" disabled={c.id !== "berr" && !has(c.id === "knock" ? "knock" : c.id)} onClick={() => setCh(c.id)}
              className={`px-2.5 py-1 rounded-md text-xs border disabled:opacity-30 ${ch === c.id ? "bg-accent border-accent text-accent-fg" : "border-border text-muted hover:text-fg"}`}>{c.label}</button>
          ))}
        </div>
      </div>
      <div className="text-xs text-muted"><span className="text-fg font-semibold">{chan.label}</span> · {chan.plain}{diff && <> · <span className="text-accent">showing {ver} minus {cmp}</span></>}</div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <div className="rounded-[var(--radius)] border border-border bg-surface p-3 overflow-x-auto">
          {noData ? <div className="p-8 text-sm text-muted">No logs on {ver}{cmp ? ` / ${cmp}` : ""} in Drive{ver === "V2.00" ? " — V2.00 logs were only sent as email attachments" : ""}.</div> : (
          <table className="text-[10px] font-mono border-collapse">
            <thead><tr><th className="px-1 text-muted text-left">RPM ↓ / psi →</th>{PSI_BINS.map((p) => <th key={p} className="px-1 text-muted font-normal">{p}</th>)}</tr></thead>
            <tbody>
              {RPM_BINS.map((r, ri) => (
                <tr key={r} onClick={() => setRpmRow(ri)} className="cursor-pointer">
                  <td className={`px-1 pr-2 ${ri === rpmRow ? "text-accent" : "text-muted"}`}>{r}</td>
                  {table[ri].map((c, ci) => (
                    <td key={ci} title={c.v == null ? "no samples" : `${r}–${r + 499} rpm · ${PSI_BINS[ci]}–${PSI_BINS[ci] + 2} psi · ${c.n} samples`}
                      onMouseEnter={() => setHover(c.v == null ? "" : `${r}–${r + 499} rpm, ${PSI_BINS[ci]}–${PSI_BINS[ci] + 2} psi: ${c.v.toFixed(chan.dp)}${chan.unit} from ${c.n} samples`)}
                      className="w-11 h-6 text-center border border-bg" style={{ background: c.v == null ? "#16191c" : col(c.v), color: c.v == null ? "transparent" : "#111" }}>
                      {c.v == null ? "" : c.v.toFixed(chan.dp)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>)}
          <div className="text-[11px] text-muted mt-2 h-4">{hover || "Hover a cell for its sample count; click a row for the RPM slice."}</div>
          <div className="flex items-center gap-2 text-[10px] text-muted mt-1"><span>green = better</span><div className="h-2 w-40 rounded" style={{ background: `linear-gradient(90deg, ${heat(0)}, ${heat(0.33)}, ${heat(0.66)}, ${heat(1)})` }} /><span>red = worse / higher</span></div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[var(--radius)] border border-border bg-surface p-3" id="surface3d">
            <div className="font-display uppercase tracking-wide">3D surface · {chan.label}</div>
            <div className="text-xs text-muted">Same table as a terrain: height and color = value.</div>
            <Surface table={table} color={col} />
          </div>
          <div className="rounded-[var(--radius)] border border-border bg-surface p-3">
            <div className="font-display uppercase tracking-wide">RPM slice · {RPM_BINS[rpmRow]}–{RPM_BINS[rpmRow] + 499} rpm</div>
            <div className="flex items-end gap-1 h-32 mt-2">
              {slice.map((c, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full" title={c.v == null ? "" : `${c.n} samples`}>
                  {c.v != null && <><div className="text-[9px] text-muted">{c.v.toFixed(chan.dp > 1 ? 1 : chan.dp)}</div>
                  <div className="w-full rounded-t" style={{ height: `${(Math.abs(c.v) / sMax) * 85}%`, background: col(c.v) }} /></>}
                </div>
              ))}
            </div>
            <div className="flex gap-1 text-[9px] text-muted mt-1">{PSI_BINS.map((p) => <div key={p} className="flex-1 text-center">{p}</div>)}</div>
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius)] border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="font-display text-lg uppercase tracking-wide">Log playback</div>
          <select value={log?.id ?? ""} onChange={(e) => setLogId(e.target.value)} className="bg-bg border border-border rounded-md px-2 py-1 text-sm">
            {verLogs.map((l) => <option key={l.id} value={l.id}>{l.id.replace("__", " · ")}</option>)}
          </select>
          <span className="text-xs text-muted">Drag the slider to scrub through the log.</span>
        </div>
        {!log ? <div className="text-sm text-muted mt-3">No logs on {ver}.</div> : (
          <>
            <input type="range" min={0} max={Math.max(0, len - 1)} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="w-full mt-3 accent-[#e23d2b]" />
            <div className="text-xs text-muted">t = {at("t")?.toFixed(1) ?? "—"} s</div>
            <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr] mt-2">
              <div>
                <div className="grid grid-cols-3 gap-2">
                  <Gauge label="Boost" v={at("boost")} min={0} max={35} unit="psi" warn={28} />
                  <Gauge label="RPM" v={at("rpm")} min={0} max={8000} unit="rpm" warn={6800} />
                  {log.c.afr ? <Gauge label="AFR" v={at("afr")} min={9} max={16} unit="" warn={13} /> : <Gauge label="Rail" v={at("rail")} min={0} max={2500} unit="psi" />}
                </div>
                <div className="space-y-2 mt-3">
                  <Bar label="Intake air temp (IAT)" v={at("iat")} min={40} max={140} unit="°F" />
                  <Bar label="Coolant temp" v={at("ect")} min={100} max={240} unit="°F" />
                  <Bar label="Throttle pedal (APP)" v={at("app")} min={0} max={100} unit="%" />
                  <Bar label="LPFP duty (fuel pump effort)" v={at("lpfp")} min={0} max={100} unit="%" />
                </div>
              </div>
              <div>{trace()}
                <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                  {[["Target", at("trgt"), "psi"], ["Timing", at("timing"), "°"], ["Knock", at("knock"), "°"], ["Rail", at("rail"), "psi"], ["AFR", at("afr"), ""], ["Load", at("load"), "%"]].map(([k, v, u]) => (
                    <div key={k as string} className="rounded bg-bg border border-border px-2 py-1"><span className="text-muted">{k}</span> <span className="font-semibold">{v == null ? "—" : `${(v as number).toFixed(1)}${u}`}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
