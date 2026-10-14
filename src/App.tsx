import { useEffect, useMemo, useState } from "react";
import CarBay from "./CarBay";
import LogBay from "./LogBay";
import TuneBay from "./TuneBay";
import {
  Job, CATEGORIES, SPEC, ZONES,
  loadJobs, saveJobs, loadOdo, saveOdo,
  money, formatDate,
} from "./lib/service-log";

type View = "bay" | "tunes" | "logs" | "book" | "spec";

const emptyJob = (): Job => ({
  id: `custom-${Date.now()}`,
  date: new Date().toISOString().slice(0, 10),
  title: "", category: "service", vendor: "", orderRef: "",
  cost: null, labor: null, mileage: null, warranty: false, notes: "", parts: "", zone: "service",
});

export default function App() {
  const [view, setView] = useState<View>(() => { const h = location.hash.slice(1) as View; return (["bay","tunes","logs","book","spec"] as View[]).includes(h) ? h : "bay"; });
  const [jobs, setJobs] = useState<Job[]>(() => loadJobs());
  const [odo, setOdo] = useState(() => loadOdo());
  const [editing, setEditing] = useState<Job | null>(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => { saveJobs(jobs); }, [jobs]);
  useEffect(() => { saveOdo(odo); }, [odo]);
  useEffect(() => { history.replaceState(null, "", `#${view}`); }, [view]);

  const stats = useMemo(() => {
    const spent = jobs.reduce((s, j) => s + (j.cost ?? 0) + (j.labor ?? 0), 0);
    const warranty = jobs.filter((j) => j.warranty).length;
    return { n: jobs.length, spent, warranty };
  }, [jobs]);

  const bookJobs = useMemo(() => {
    let xs = [...jobs].sort((a, b) => b.date.localeCompare(a.date));
    if (filter !== "all") xs = xs.filter((j) => j.category === filter || j.zone === filter);
    if (q.trim()) {
      const qq = q.toLowerCase();
      xs = xs.filter((j) =>
        [j.title, j.vendor, j.orderRef, j.notes, j.parts].join(" ").toLowerCase().includes(qq)
      );
    }
    return xs;
  }, [jobs, filter, q]);

  function saveEditor(j: Job) {
    setJobs((prev) => {
      const i = prev.findIndex((x) => x.id === j.id);
      if (i >= 0) { const n = [...prev]; n[i] = j; return n; }
      return [j, ...prev];
    });
    setEditing(null);
  }
  function deleteJob(id: string) {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setEditing(null);
  }

  const tabs: { id: View; label: string }[] = [
    { id: "bay", label: "The car" },
    { id: "tunes", label: "Tunes" },
    { id: "logs", label: "Logs" },
    { id: "book", label: "Service book" },
    { id: "spec", label: "Spec sheet" },
  ];

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-border bg-surface/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2.5">
            <img src="./logo.svg" alt="GTI" className="w-10 h-10" />
            <div>
            <div className="font-display text-2xl tracking-wide uppercase leading-none">GTI Log</div>
            <div className="text-xs text-muted mt-0.5">United Grey · 2011 · CCTA · DSG</div>
            </div>
          </div>
          <nav className="flex gap-1 flex-wrap">
            {tabs.map((t) => (
              <button key={t.id} type="button" onClick={() => setView(t.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition
                  ${view === t.id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg hover:bg-surface-2"}`}>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <label className="text-muted flex items-center gap-1.5">
              Odo
              <input type="number" value={odo} onChange={(e) => setOdo(Number(e.target.value) || 0)}
                className="w-24 bg-bg border border-border rounded-md px-2 py-1 text-fg font-medium" />
            </label>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-3 flex flex-wrap gap-3 text-sm">
          <Stat label="Jobs" value={String(stats.n)} />
          <Stat label="Spent" value={money(stats.spent)} />
          <Stat label="Warranty" value={String(stats.warranty)} />
          <Stat label="Power" value="~310 whp" />
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {view === "bay" && <CarBay jobs={jobs} onPickJob={(j) => { setEditing(j); setView("book"); }} />}
        {view === "logs" && <LogBay />}
        {view === "tunes" && <TuneBay />}
        {view === "book" && (
          <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 items-center">
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search jobs…"
                  className="flex-1 min-w-[160px] bg-surface border border-border rounded-md px-3 py-2 text-sm" />
                <select value={filter} onChange={(e) => setFilter(e.target.value)}
                  className="bg-surface border border-border rounded-md px-2 py-2 text-sm">
                  <option value="all">All categories</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <button type="button" onClick={() => setEditing(emptyJob())}
                  className="bg-accent text-accent-fg rounded-md px-3 py-2 text-sm font-medium">Add job</button>
              </div>
              <ul className="rounded-[var(--radius)] border border-border bg-surface divide-y divide-border overflow-hidden">
                {bookJobs.map((j) => (
                  <li key={j.id}>
                    <button type="button" onClick={() => setEditing(j)}
                      className={`w-full text-left px-4 py-3 hover:bg-surface-2 ${editing?.id === j.id ? "bg-surface-2" : ""}`}>
                      <div className="flex justify-between gap-3">
                        <div>
                          <div className="font-medium">{j.title}</div>
                          <div className="text-xs text-muted mt-0.5">
                            {formatDate(j.date)} · {j.category}
                            {j.vendor ? ` · ${j.vendor}` : ""}
                            {j.orderRef ? ` · ${j.orderRef}` : ""}
                            {j.warranty ? " · warranty" : ""}
                          </div>
                        </div>
                        <div className="text-sm font-semibold shrink-0">{money(j.cost)}</div>
                      </div>
                    </button>
                  </li>
                ))}
                {bookJobs.length === 0 && <li className="px-4 py-8 text-sm text-muted text-center">No matching jobs.</li>}
              </ul>
            </div>
            <div>
              {editing ? (
                <JobEditor job={editing} onChange={setEditing} onSave={saveEditor} onDelete={deleteJob} onCancel={() => setEditing(null)} />
              ) : (
                <div className="rounded-[var(--radius)] border border-border bg-surface p-6 text-sm text-muted">
                  Select a job to edit, or add a new one.
                </div>
              )}
            </div>
          </div>
        )}
        {view === "spec" && <SpecSheet odo={odo} />}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-bg border border-border px-3 py-1.5">
      <span className="text-muted text-xs uppercase tracking-wider mr-2">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function JobEditor({ job, onChange, onSave, onDelete, onCancel }: {
  job: Job; onChange: (j: Job) => void; onSave: (j: Job) => void; onDelete: (id: string) => void; onCancel: () => void;
}) {
  const set = <K extends keyof Job>(k: K, v: Job[K]) => onChange({ ...job, [k]: v });
  return (
    <form className="rounded-[var(--radius)] border border-border bg-surface p-4 space-y-3 sticky top-24"
      onSubmit={(e) => { e.preventDefault(); onSave(job); }}>
      <div className="font-display text-lg uppercase tracking-wide">Job editor</div>
      <Field label="What you did">
        <input required value={job.title} onChange={(e) => set("title", e.target.value)} className="field" />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Date"><input type="date" value={job.date} onChange={(e) => set("date", e.target.value)} className="field" /></Field>
        <Field label="Category">
          <select value={job.category} onChange={(e) => { set("category", e.target.value); set("zone", e.target.value); }} className="field">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Parts"><input value={job.parts} onChange={(e) => set("parts", e.target.value)} className="field" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Vendor"><input value={job.vendor} onChange={(e) => set("vendor", e.target.value)} className="field" /></Field>
        <Field label="Order #"><input value={job.orderRef} onChange={(e) => set("orderRef", e.target.value)} className="field" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Parts cost">
          <input type="number" step="0.01" value={job.cost ?? ""} onChange={(e) => set("cost", e.target.value === "" ? null : Number(e.target.value))} className="field" />
        </Field>
        <Field label="Shop labor">
          <input type="number" step="0.01" placeholder="DIY" value={job.labor ?? ""} onChange={(e) => set("labor", e.target.value === "" ? null : Number(e.target.value))} className="field" />
        </Field>
      </div>
      <Field label="Mileage">
        <input type="number" value={job.mileage ?? ""} onChange={(e) => set("mileage", e.target.value === "" ? null : Number(e.target.value))} className="field" />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={job.warranty} onChange={(e) => set("warranty", e.target.checked)} />
        Lifetime warranty replacement — still counts
      </label>
      <Field label="Notes">
        <textarea rows={4} value={job.notes} onChange={(e) => set("notes", e.target.value)} className="field" />
      </Field>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={() => onDelete(job.id)} className="text-sm text-accent px-2 py-1.5">Delete</button>
        <div className="flex-1" />
        <button type="button" onClick={onCancel} className="text-sm text-muted px-3 py-1.5">Cancel</button>
        <button type="submit" className="bg-accent text-accent-fg rounded-md px-4 py-1.5 text-sm font-medium">Save</button>
      </div>
      <style>{`.field{width:100%;background:var(--color-bg);border:1px solid var(--color-border);border-radius:0.5rem;padding:0.4rem 0.6rem;color:var(--color-fg);font-size:0.875rem}`}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-muted space-y-1">
      <span>{label}</span>
      <div>{children}</div>
    </label>
  );
}

function SpecSheet({ odo }: { odo: number }) {
  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius)] border border-border bg-surface p-5">
        <h1 className="font-display text-3xl uppercase tracking-wide">{SPEC.car}</h1>
        <dl className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <Row k="Engine" v={SPEC.engine} />
          <Row k="Transmission" v={SPEC.trans} />
          <Row k="Odometer" v={`${odo.toLocaleString()} mi`} />
          <Row k="Power" v={SPEC.power} />
          <Row k="Current tune" v={SPEC.currentTune} />
        </dl>
      </div>
      {SPEC.mods.map((g) => (
        <div key={g.group} className="rounded-[var(--radius)] border border-border bg-surface p-5">
          <h2 className="font-display text-xl uppercase tracking-wide text-accent mb-2">{g.group}</h2>
          <ul className="grid sm:grid-cols-2 gap-1.5 text-sm">
            {g.items.map((it) => <li key={it} className="flex gap-2"><span className="text-ok">·</span>{it}</li>)}
          </ul>
        </div>
      ))}
      <div className="rounded-[var(--radius)] border border-border bg-surface p-5 space-y-2">
        <h2 className="font-display text-xl uppercase tracking-wide">Notes</h2>
        {SPEC.notes.map((n) => <p key={n} className="text-sm text-muted leading-relaxed">{n}</p>)}
        <p className="text-sm text-muted leading-relaxed mt-3">
          Zones on The car tab: {ZONES.map((z) => z.label).join(", ")}.
        </p>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-1.5">
      <dt className="text-muted">{k}</dt>
      <dd className="font-medium text-right">{v}</dd>
    </div>
  );
}
