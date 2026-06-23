import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, CalendarDays, ArrowRight, FileSpreadsheet, FileType, FileText } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { api } from "@/utils/api";
import type { Year, Month } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { exportCSV, exportXLSX, exportPDF } from "@/utils/export";
import { useSettings } from "@/contexts/SettingsContext";

export default function YearsPage() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [years, setYears] = useState<Year[]>([]);
  const [monthCounts, setMonthCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<Record<number, string>>({});
  const [showNew, setShowNew] = useState(false);
  const [nyName, setNyName] = useState("");
  const [delId, setDelId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const allYears = await api.years.list();
      setYears(allYears);

      const counts: Record<number, number> = {};
      for (const y of allYears) {
        const months = await api.months.listByYear(y.id);
        counts[y.id] = months.length;
      }
      setMonthCounts(counts);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(name: string) {
    await api.years.create({ name });
    await load();
    setShowNew(false);
    setNyName("");
  }

  async function handleDelete(id: number) {
    await api.years.delete(id);
    setDelId(null);
    load();
  }

  async function handleExport(yearId: number, yearName: string, format: "csv" | "xlsx" | "pdf") {
    setExporting((prev) => ({ ...prev, [yearId]: format }));
    try {
      const data = await api.years.getData(yearId);
      const sym = settings.currency.symbol;
      if (format === "csv") exportCSV(data, yearName, sym);
      else if (format === "xlsx") exportXLSX(data, yearName, sym);
      else exportPDF(data, yearName, sym);
    } catch (err) { console.error("Export failed", err); }
    setExporting((prev) => {
      const next = { ...prev };
      delete next[yearId];
      return next;
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-32" /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Years</h1>
        <Button onClick={() => { setShowNew(true); setNyName(""); }}><Plus className="size-4" /> New Year</Button>
      </div>

      {years.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center text-muted-foreground">
          <CalendarDays className="mb-4 size-12" />
          <h2 className="mb-2 text-xl font-semibold">No Years Yet</h2>
          <p className="mb-4">Create your first year to start budgeting.</p>
          <Button onClick={() => { setShowNew(true); setNyName(""); }}><Plus className="size-4" /> Create Year</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {years.map((year) => {
            const exp = exporting[year.id];
            return (
              <Card key={year.id} className="cursor-pointer" onClick={() => navigate(`/years/${year.id}`)}>
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{year.name}</h3>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {(["csv", "xlsx", "pdf"] as const).map((fmt) => (
                        <Button
                          key={fmt}
                          size="xs"
                          variant="outline"
                          disabled={exp === fmt}
                          onClick={() => handleExport(year.id, year.name, fmt)}
                          title={`Export as ${fmt.toUpperCase()}`}
                        >
                          {exp === fmt ? (
                            <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : fmt === "csv" ? (
                            <FileType className="size-3" />
                          ) : fmt === "xlsx" ? (
                            <FileSpreadsheet className="size-3" />
                          ) : (
                            <FileText className="size-3" />
                          )}
                        </Button>
                      ))}
                       <Button size="xs" variant="destructive" onClick={() => setDelId(year.id)}>Del</Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{monthCounts[year.id] ?? 0} months</p>
                  <div className="mt-3 flex justify-end">
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={delId !== null}
        title="Delete Year"
        message="Delete this year and all its months?"
        onConfirm={() => handleDelete(delId!)}
        onCancel={() => setDelId(null)}
      />

      <Dialog open={showNew} onOpenChange={(open) => { if (!open) { setShowNew(false); setNyName(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Year</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium text-muted-foreground">Year Name</label><Input value={nyName} onChange={(e) => setNyName(e.target.value)} placeholder="e.g. 2026" className="mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setShowNew(false); setNyName(""); }}>Cancel</Button><Button onClick={() => handleCreate(nyName)}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
