import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Calendar, DollarSign, TrendingUp, ArrowLeft, ArrowRight } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { api } from "@/utils/api";
import type { Year, Month } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/utils/currency";

export default function YearDetail() {
  const { settings } = useSettings();
  const { yearId } = useParams();
  const navigate = useNavigate();
  const [year, setYear] = useState<Year | null>(null);
  const [months, setMonths] = useState<Month[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNew, setShowNew] = useState(false);
  const [nmName, setNmName] = useState("");
  const [nmBudget, setNmBudget] = useState("");
  const [delId, setDelId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const allYears = await api.years.list();
      const y = allYears.find((y) => y.id === Number(yearId)) || null;
      setYear(y);
      if (y) {
        setMonths(await api.months.listByYear(y.id));
      } else {
        setMonths([]);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [yearId]);

  async function handleCreateMonth(name: string, budget: number) {
    if (!year) return;
    await api.months.create({ year_id: year.id, name, total_budget: budget });
    await load();
    setShowNew(false);
    setNmName("");
    setNmBudget("");
  }

  async function handleCopyMonth(id: number) {
    const month = months.find((m) => m.id === id);
    if (!month) return;
    await api.months.copy(id, `${month.name} (Copy)`);
    load();
  }

  async function handleDeleteMonth(id: number) {
    await api.months.delete(id);
    setDelId(null);
    load();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!year) {
    return (
      <div className="flex flex-col items-center py-20 text-center text-muted-foreground">
        <Calendar className="mb-4 size-12" />
        <h2 className="mb-2 text-xl font-semibold">Year Not Found</h2>
        <Button variant="outline" onClick={() => navigate("/years")}><ArrowLeft className="size-4" /> Back to Years</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/years")}><ArrowLeft className="size-4" /></Button>
          <h1 className="text-2xl font-bold">{year.name}</h1>
        </div>
        <Button onClick={() => { setShowNew(true); setNmName(""); setNmBudget(""); }}><Plus className="size-4" /> New Month</Button>
      </div>

      {months.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center text-muted-foreground">
          <Calendar className="mb-4 size-12" />
          <h2 className="mb-2 text-xl font-semibold">No Months Yet</h2>
          <p className="mb-4">Create your first month for {year.name}.</p>
          <Button onClick={() => { setShowNew(true); setNmName(""); setNmBudget(""); }}><Plus className="size-4" /> Create Month</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {months.map((month) => (
            <Card key={month.id} className="cursor-pointer" onClick={() => navigate(`/months/${month.id}`)}>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{month.name}</h3>
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
            <div><label className="text-sm font-medium text-muted-foreground">Month Name</label><Input value={nmName} onChange={(e) => setNmName(e.target.value)} placeholder="e.g. June 2026" className="mt-1" /></div>
            <div><label className="text-sm font-medium text-muted-foreground">Total Budget</label><Input type="number" value={nmBudget} onChange={(e) => setNmBudget(e.target.value)} placeholder="3000" className="mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setShowNew(false); setNmName(""); setNmBudget(""); }}>Cancel</Button><Button onClick={() => handleCreateMonth(nmName, Number(nmBudget) || 0)}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
