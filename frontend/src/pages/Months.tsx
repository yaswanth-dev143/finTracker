import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Calendar, DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { api } from "@/utils/api";
import type { Year, Month } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/utils/currency";

export default function MonthsPage() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [years, setYears] = useState<Year[]>([]);
  const [months, setMonths] = useState<Month[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [nmName, setNmName] = useState("");
  const [nmBudget, setNmBudget] = useState("");
  const [nmYearId, setNmYearId] = useState<number | null>(null);
  const [delId, setDelId] = useState<number | null>(null);

  async function loadMonths() {
    setLoading(true);
    try {
      const allYears = await api.years.list();
      setYears(allYears);
      if (allYears.length > 0 && nmYearId === null) {
        setNmYearId(allYears[0].id);
      }
      setMonths(await api.months.list());
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  useEffect(() => { loadMonths(); }, []);

  async function handleCreateMonth(name: string, budget: number) {
    if (!nmYearId) return;
    await api.months.create({ year_id: nmYearId, name, total_budget: budget });
    await loadMonths();
    setShowNew(false);
    setNmName("");
    setNmBudget("");
  }

  async function handleCopyMonth(id: number) {
    const month = months.find(m => m.id === id);
    if (!month) return;
    await api.months.copy(id, `${month.name} (Copy)`);
    loadMonths();
  }

  async function handleDeleteMonth(id: number) {
    await api.months.delete(id);
    setDelId(null);
    loadMonths();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-32" /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Months</h1>
        <Button onClick={() => { setShowNew(true); setNmName(""); setNmBudget(""); }}><Plus className="size-4" /> New Month</Button>
      </div>

      {months.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center text-muted-foreground">
          <Calendar className="mb-4 size-12" />
          <h2 className="mb-2 text-xl font-semibold">No Months Yet</h2>
          <p className="mb-4">Create your first month to start budgeting.</p>
          <Button onClick={() => { setShowNew(true); setNmName(""); setNmBudget(""); }}><Plus className="size-4" /> Create Month</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {months.map((month) => (
            <Card key={month.id} className="cursor-pointer" onClick={() => navigate(`/months/${month.id}`)}>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{month.name}</h3>
                    <p className="text-xs text-muted-foreground">{years.find((y) => y.id === month.year_id)?.name || "Unknown year"}</p>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="xs" variant="outline" onClick={() => handleCopyMonth(month.id)}>Copy</Button>
                    <Button size="xs" variant="destructive" onClick={() => setDelId(month.id)}>Del</Button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><DollarSign className="size-3.5 text-primary" /> Budget</span>
                    <span>{formatCurrency(Number(month.total_budget), settings.currency.symbol)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><TrendingUp className="size-3.5 text-green-500" /> Income</span>
                    <span>{formatCurrency(Number(month.total_income), settings.currency.symbol)}</span>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={delId !== null}
        title="Delete Month"
        message="Delete this month and all its data?"
        onConfirm={() => handleDeleteMonth(delId!)}
        onCancel={() => setDelId(null)}
      />

      <Dialog open={showNew} onOpenChange={(open) => { if (!open) { setShowNew(false); setNmName(""); setNmBudget(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Month</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium text-muted-foreground">Year</label><Select value={String(nmYearId)} onValueChange={(v) => setNmYearId(Number(v))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{years.map((y) => <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>)}</SelectContent></Select></div>
            <div><label className="text-sm font-medium text-muted-foreground">Month Name</label><Input value={nmName} onChange={(e) => setNmName(e.target.value)} placeholder="e.g. June 2026" className="mt-1" /></div>
            <div><label className="text-sm font-medium text-muted-foreground">Total Budget</label><Input type="number" value={nmBudget} onChange={(e) => setNmBudget(e.target.value)} placeholder="3000" className="mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setShowNew(false); setNmName(""); setNmBudget(""); }}>Cancel</Button><Button onClick={() => handleCreateMonth(nmName, Number(nmBudget) || 0)}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
