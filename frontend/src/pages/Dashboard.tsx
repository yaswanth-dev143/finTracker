import { useState, useEffect } from "react";
import { Plus, Calendar, CalendarDays, TrendingUp, TrendingDown, Layers, Receipt, DollarSign, AlertTriangle, Target, Award, Sparkles } from "lucide-react";
import { api, type DashboardSummary } from "@/utils/api";
import type { Year } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/utils/currency";

function StatCard({ icon: Icon, label, value, color, accent, children }: {
  icon: any; label: string; value: string; color: string; accent: string; children?: React.ReactNode;
}) {
  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className={cn("h-1 w-full", accent)} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={cn("flex size-9 items-center justify-center rounded-xl", color)}>
            <Icon className="size-4 text-white" />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
        {children}
      </CardContent>
    </Card>
  );
}

function NamedCard({ icon: Icon, label, name, sub, color, bg, bar }: {
  icon: any; label: string; name: string | undefined; sub?: string; color: string; bg: string; bar?: number;
}) {
  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className={cn("h-1 w-full", bg.replace("bg-", "bg-").replace("/10", "/40"))} />
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", bg)}>
            <Icon className={cn("size-4", color)} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" title={name}>{name || "—"}</p>
            <p className="text-xs text-muted-foreground">{label}{sub ? ` · ${sub}` : ""}</p>
          </div>
        </div>
        {bar !== undefined && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all", bg.replace("/10", ""))}
              style={{ width: `${Math.min(bar, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { settings } = useSettings();
  const [years, setYears] = useState<Year[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [showNewYear, setShowNewYear] = useState(false);
  const [nyName, setNyName] = useState("");

  const [showNewMonth, setShowNewMonth] = useState(false);
  const [nmName, setNmName] = useState("");
  const [nmBudget, setNmBudget] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const allYears = await api.years.list();
      setYears(allYears);
      setSummary(await api.dashboard.summary());
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handleCreateYear(name: string) {
    await api.years.create({ name });
    await loadData();
    setShowNewYear(false);
    setNyName("");
  }

  async function handleCreateMonth(name: string, budget: number) {
    if (years.length === 0) return;
    await api.months.create({ year_id: years[0].id, name, total_budget: budget });
    await loadData();
    setShowNewMonth(false);
    setNmName("");
    setNmBudget("");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"><Skeleton className="h-8 w-32" /><Skeleton className="h-8 w-24" /></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (years.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Calendar className="size-8 text-primary" />
        </div>
        <h2 className="mb-2 text-xl font-semibold">No Years Yet</h2>
        <p className="mb-6 max-w-sm text-sm">Create your first year to start tracking your budget and unlock insights.</p>
        <Button onClick={() => setShowNewYear(true)}><Plus className="size-4" /> Create Year</Button>
        <Dialog open={showNewYear} onOpenChange={(open) => { if (!open) { setShowNewYear(false); setNyName(""); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Year</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><label className="text-sm font-medium text-muted-foreground">Year Name</label><Input value={nyName} onChange={(e) => setNyName(e.target.value)} placeholder="e.g. 2026" className="mt-1" /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => { setShowNewYear(false); setNyName(""); }}>Cancel</Button><Button onClick={() => handleCreateYear(nyName)}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const s = summary;
  const overBudget = (s?.months_over_budget ?? 0) > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Your financial overview at a glance</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowNewYear(true)}><Plus className="size-3.5" /> Year</Button>
          <Button size="sm" variant="outline" onClick={() => setShowNewMonth(true)}><Plus className="size-3.5" /> Month</Button>
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Overview</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard icon={Calendar} label="Years" value={String(s?.year_count ?? 0)} color="bg-primary" accent="bg-primary" />
          <StatCard icon={CalendarDays} label="Total Months" value={String(s?.month_count ?? 0)} color="bg-sky-500" accent="bg-sky-500" />
          <StatCard icon={Receipt} label="Transactions" value={String(s?.total_transactions ?? 0)} color="bg-blue-500" accent="bg-blue-500" />
          <StatCard icon={DollarSign} label="Avg Monthly Spend" value={formatCurrency(s?.avg_monthly_spending ?? 0, settings.currency.symbol)} color="bg-emerald-500" accent="bg-emerald-500" />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Spending Highlights</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NamedCard
            icon={TrendingUp} label="Highest spending" name={s?.highest_spend_month?.name}
            sub={formatCurrency(s?.highest_spend_month?.amount ?? 0, settings.currency.symbol)}
            color="text-orange-600" bg="bg-orange-500/10"
          />
          <NamedCard
            icon={TrendingDown} label="Lowest spending" name={s?.lowest_spend_month?.name}
            sub={formatCurrency(s?.lowest_spend_month?.amount ?? 0, settings.currency.symbol)}
            color="text-green-600" bg="bg-green-500/10"
          />
          <Card className={cn("overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md", overBudget && "ring-1 ring-red-500/20")}>
            <div className={cn("h-1 w-full", overBudget ? "bg-red-500" : "bg-muted")} />
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn("flex size-9 items-center justify-center rounded-xl", overBudget ? "bg-red-500/10" : "bg-muted")}>
                  <AlertTriangle className={cn("size-4", overBudget ? "text-red-500" : "text-muted-foreground")} />
                </div>
                <div>
                  <p className={cn("text-2xl font-bold tracking-tight", overBudget && "text-red-500")}>{s?.months_over_budget ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Month{(s?.months_over_budget ?? 0) !== 1 ? "s" : ""} over budget</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <NamedCard
            icon={Layers} label="Top spending group" name={s?.highest_spend_group?.name}
            sub={s?.highest_spend_group ? `${formatCurrency(s.highest_spend_group.amount, settings.currency.symbol)} in ${s.highest_spend_group.month}` : undefined}
            color="text-purple-600" bg="bg-purple-500/10"
          />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Category Insights</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <NamedCard
            icon={Award} label="Highest utilization" name={s?.most_utilized_category?.name}
            sub={s?.most_utilized_category?.month}
            color="text-amber-600" bg="bg-amber-500/10"
            bar={s?.most_utilized_category?.utilization}
          />
          <NamedCard
            icon={Target} label="Lowest utilization" name={s?.least_utilized_category?.name}
            sub={s?.least_utilized_category?.month}
            color="text-sky-600" bg="bg-sky-500/10"
            bar={s?.least_utilized_category?.utilization}
          />
        </div>
      </section>

      <Dialog open={showNewYear} onOpenChange={(open) => { if (!open) { setShowNewYear(false); setNyName(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Year</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium text-muted-foreground">Year Name</label><Input value={nyName} onChange={(e) => setNyName(e.target.value)} placeholder="e.g. 2027" className="mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setShowNewYear(false); setNyName(""); }}>Cancel</Button><Button onClick={() => handleCreateYear(nyName)}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewMonth} onOpenChange={(open) => { if (!open) { setShowNewMonth(false); setNmName(""); setNmBudget(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Month</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium text-muted-foreground">Month Name</label><Input value={nmName} onChange={(e) => setNmName(e.target.value)} placeholder="e.g. July 2026" className="mt-1" /></div>
            <div><label className="text-sm font-medium text-muted-foreground">Total Budget</label><Input type="number" value={nmBudget} onChange={(e) => setNmBudget(e.target.value)} placeholder="3000" className="mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setShowNewMonth(false); setNmName(""); setNmBudget(""); }}>Cancel</Button><Button onClick={() => handleCreateMonth(nmName, Number(nmBudget) || 0)}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
