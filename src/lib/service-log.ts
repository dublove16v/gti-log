import seedJobs from "../data/jobs.json";
import logsData from "../data/logs.json";

export type Job = {
  id: string;
  date: string;
  title: string;
  category: string;
  vendor: string;
  orderRef: string;
  cost: number | null;
  labor: number | null;
  mileage: number | null;
  warranty: boolean;
  notes: string;
  parts: string;
  zone: string;
};

export type LogPoint = {
  t: number | null;
  boost: number | null;
  trgt: number | null;
  knock: number | null;
  rail: number | null;
  railT?: number | null;
  lpfp: number | null;
  iat: number | null;
  rpm: number | null;
  app: number | null;
};

export type LogSummary = {
  id: string;
  date: string;
  name: string;
  version: string | null;
  rows: number;
  durationSec: number;
  mileage: number | null;
  maxBoost: number | null;
  maxTarget: number | null;
  worstKnock: number | null;
  minRailWot: number | null;
  maxLpfp: number | null;
  maxIat: number | null;
  wot: boolean;
  baro?: number;
  chart: LogPoint[];
};

export const STORAGE_KEY = "gti-log-jobs-v2";
export const ODO_KEY = "gti-log-odo";

export const CATEGORIES = [
  "intake","manifold","turbo","fuel","chassis","brakes","exhaust","cabin","service","tune","other",
] as const;

export const ZONES = [
  { id: "intake", label: "Intake", short: "Air goes in here",
    summary: "Cold-air path into the engine — filter, pipe, and MAF (mass airflow sensor that measures how much air the engine is breathing)." },
  { id: "manifold", label: "Manifold", short: "Air distributor on top of the engine",
    summary: "Plastic intake manifold with runner flaps. MK6s are known for flap failures (code P2015) and carbon on the valves." },
  { id: "turbo", label: "Turbo", short: "Exhaust-driven compressor",
    summary: "CTS K04X turbo, intercooler (cools the compressed air), diverter valve, and N75 boost solenoid that tells the wastegate how much boost to make." },
  { id: "fuel", label: "Fuel", short: "Pump, filter, rail",
    summary: "Low-pressure pump in the tank (LPFP) feeds the high-pressure pump. Stock system is the current power limit — duty cycle near 100% means it can't push more fuel." },
  { id: "chassis", label: "Chassis", short: "Suspension and mounts",
    summary: "Struts, control arms, bushings, mounts, bearings — anything that holds the body and drivetrain together." },
  { id: "brakes", label: "Brakes", short: "Stopping hardware",
    summary: "Pads, rotors, sensors, parking-brake cables." },
  { id: "exhaust", label: "Exhaust", short: "Spent gases out the back",
    summary: "Downpipe (first pipe after the turbo), clamp, and 3\" cutout for a louder bypass." },
  { id: "cabin", label: "Cabin", short: "Interior and body trim",
    summary: "Locks, console, headliner, badges, weather strips, wipers." },
] as const;

export const SEED: Job[] = seedJobs as Job[];
export const LOGS: LogSummary[] = logsData as LogSummary[];

export type TuneVer = { ver: string; date: string; change: string; why: string; outcome: string; note: string };
export const TUNE_TIMELINE: TuneVer[] = [
  { ver: "V1.00", date: "2025-04-08", change: "First ProTune map for the K04X setup. Boost target about 20–22 psi. Crackles (pops on lift-off) on.", why: "New tune after the K04X, FMIC, downpipe and 4-bar MAP install (Order 52541).", outcome: "Ran, but logs showed it running out of fuel at high rpm.", note: "Mods: APR intake, CTS FMIC, CTS downpipe, 3\" cutout, IE catch can, GFB DV+, NGK plugs, red-top coils, Stratified DSG, CTS K04X, 4-bar MAP." },
  { ver: "V1.10", date: "2025-05-22", change: "Revision to handle fuel falling off up top.", why: "Luke's logs: fuel pressure sagging near redline. John asked about the fuel filter.", outcome: "Luke fitted a new Mann fuel filter. Overboost (more boost than asked for) still showed up.", note: "" },
  { ver: "V1.20", date: "2025-06-05", change: "Overboost fix: changed how the throttle closes when traction control steps in.", why: "Boost spikes when traction control shut the throttle.", outcome: "Better through summer. Then a split intercooler hose caused overboost in 6th (Jun–Jul).", note: "" },
  { ver: "V1.30", date: "2025-08-15", change: "Revision after the summer logs.", why: "New silicone intercooler hose fitted; overboost follow-up.", outcome: "Still knock (timing pulls) in some pulls.", note: "" },
  { ver: "V1.40", date: "2025-09-29", change: "Crackles turned off.", why: "Smoke test (pumping smoke in to find leaks) found a failed intake-manifold runner. Valves and injectors cleaned.", outcome: "Oct 6: fuel trims spiking, rail pressure dropping. John pointed at the low-pressure fuel pump (LPFP).", note: "" },
  { ver: "V1.50", date: "2025-10-20", change: "Changes aimed at knock.", why: "After the LPFP swap; knock still showing.", outcome: "A low-boost (8 psi) mode pointed at the N75 boost solenoid.", note: "" },
  { ver: "V1.60", date: "2025-10-23", change: "Boost about 22–23 psi tapering to 20.", why: "Follow-up on V1.50 logs.", outcome: "John: at the limit of the stock fuel system.", note: "" },
  { ver: "V1.70", date: "2025-10-27", change: "Follow-up map.", why: "V1.60 logs.", outcome: "Nov 6: N75 replaced. Codes P0101/P2178 (airflow sensor / lean) → Bremi MAF bought Nov 10.", note: "" },
  { ver: "V1.80", date: "2026-05-04", change: "Spring refresh.", why: "Back on the road after winter; new logs.", outcome: "Ran fine; led to V1.90 clean-up.", note: "" },
  { ver: "V1.90", date: "2026-06-11", change: "Timing and wastegate tables cleaned up.", why: "V1.80 logs.", outcome: "\"Pulls like a V8.\" Aug: P2015 (manifold flap) chase. Sep 18–22: high fuel trims, LPFP maxed, rail low; MAF coupler found unseated. Luke flashed back to V1.80.", note: "" },
  { ver: "V2.00", date: "2026-09-29", change: "Safer revision of V1.80.", why: "Stock fuel system maxed (LPFP duty at its limit). New fuel filter on Sep 28 didn't fix it.", outcome: "Oct 1 logs looked good; Oct 2 was the stopping point. Next step: LPFP + aux fuel, or LPFP + MK7R injectors.", note: "No V2.00 logs in Drive (sent only as email attachments)." },
];

export const SPEC = {
  car: "2011 Volkswagen GTI MK6 · United Grey",
  engine: "CCTA 2.0T FSI (USDM)",
  trans: "DQ250 DSG (6-speed dual-clutch)",
  odo: 171650,
  power: "About 310 wheel hp (estimate on current map)",
  currentTune: "Stratified Purdy Tune V2.00",
  mods: [
    { group: "Forced induction", items: ["CTS K04X turbo", "CTS front-mount intercooler (FMIC)", "CTS billet FMIC connector", "GFB DV+ diverter valve", "Pierburg N75 boost solenoid", "4-bar MAP sensor"] },
    { group: "Intake & crankcase", items: ["APR carbon intake (private sale)", "IE catch can (private sale)", "Bremi MAF"] },
    { group: "Exhaust", items: ["CTS downpipe", "3\" cutout"] },
    { group: "Fuel & ignition", items: ["Delphi LPFP (replaced stock)", "NGK 2669 plugs", "Bosch / red-top coils"] },
    { group: "Drivetrain", items: ["Stratified DSG tune with RTD", "CTS transmission mount"] },
    { group: "Chassis", items: ["Koni Sport front struts", "Koni rear shocks", "Lemforder control arms / mounts", "Whiteline rear endlinks", "Poly rear bushings", "Subframe locking collars"] },
    { group: "Brakes", items: ["PowerStop CRK5667 kit", "Brembo brakes (private sale, VWVortex)"] },
    { group: "Tune", items: ["Stratified ProTune (Order 52541) — John Degrano", "COBB Accessport (private sale, VWVortex)", "V2.00 currently flashed"] },
  ],
  notes: [
    "V2.00 is on the car. Safer than V1.90, not stronger. The low-pressure pump is still the limit.",
    "Receipts found: CTS K04X (UroTuning 20694052), CTS downpipe (20556745), XForce cutout (20683470). Private sales (no receipt, per Luke): APR intake (Facebook Marketplace), IE catch can (Craigslist), Accessport and Brembo brakes (VWVortex).",
    "Pre-2020 FCP orders were not included (likely a different car).",
  ],
};

export function money(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatDate(iso: string) {
  if (!iso) return "Date unknown";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function loadJobs(): Job[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(SEED);
    const stored: Job[] = JSON.parse(raw);
    const byId = new Map(stored.map((j) => [j.id, j]));
    const merged = SEED.map((s) => {
      const prev = byId.get(s.id);
      if (!prev) return { ...s };
      return { ...s, cost: prev.cost ?? s.cost, mileage: prev.mileage ?? s.mileage, labor: prev.labor ?? s.labor, notes: prev.notes || s.notes };
    });
    for (const j of stored) if (!SEED.find((s) => s.id === j.id)) merged.push(j);
    return merged.sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return structuredClone(SEED);
  }
}

export function saveJobs(jobs: Job[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export function loadOdo(): number {
  const v = localStorage.getItem(ODO_KEY);
  return v ? Number(v) : SPEC.odo;
}

export function saveOdo(n: number) {
  localStorage.setItem(ODO_KEY, String(n));
}
