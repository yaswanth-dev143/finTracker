import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, DollarSign, TrendingUp, Plus } from "lucide-react";
import { api } from "@/utils/api";
import type { MonthSummary } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/utils/currency";
import GroupChart from "@/components/GroupChart";
import TransactionModal from "@/components/TransactionModal";

function getHealthColor(pct: number) {
  if (pct >= 100) return "bg-red-500";
  if (pct >= 80) return "bg-yellow-500";
  return "bg-green-500";
}

export default function MonthDetail() {
  const { settings } = useSettings();
  const { monthId } = useParams();
  const navigate = useNavigate();
  const [month, setMonth] = useState<MonthSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [showGroupForm, setShowGroupForm] = useState(false);
  const [grpName, setGrpName] = useState("");
  const [grpBudget, setGrpBudget] = useState("");
  const [showTx, setShowTx] = useState<{ id: number; name: string } | null>(null);
  const [txAmount, setTxAmount] = useState("");
  const [txDesc, setTxDesc] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [txSaving, setTxSaving] = useState(false);

  async function load() {
    if (!monthId) return;
    setLoading(true);
    try {
      setMonth(await api.months.get(Number(monthId)));
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { load(); }, [monthId]);

  async function handleCreateGroup() {
    if (!monthId || !grpName || !grpBudget) return;
    await api.groups.create({ month_id: Number(monthId), name: grpName, allocated_budget: Number(grpBudget) });
    await load();
    setShowGroupForm(false);
    setGrpName("");
    setGrpBudget("");
  }

  async function handleAddTransaction(categoryId: number, amount: number, description: string, date: string) {
    await api.transactions.create({ category_id: categoryId, amount, type: "expense", description, date });
    await load();
    setShowTx(null);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!month) {
    return (
      <div className="flex flex-col items-center py-20 text-center text-muted-foreground">
        <Calendar className="mb-4 size-12" />
        <h2 className="mb-2 text-xl font-semibold">Month Not Found</h2>
        <Button variant="outline" onClick={() => navigate("/")}>Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={() => navigate(-1 as any)}><ArrowLeft className="size-3.5" /> Back</Button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{month.name}</h1>
        <Button size="sm" onClick={() => { setShowGroupForm(true); setGrpName(""); setGrpBudget(""); }}><Plus className="size-4" /> Group</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card size="sm">
          <CardContent className="flex flex-col gap-1 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><DollarSign className="size-3.5" /> Budget</div>
            <p className="text-lg font-bold">{formatCurrency(month.total_budget, settings.currency.symbol)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col gap-1 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><TrendingUp className="size-3.5 text-green-500" /> Income</div>
            <p className="text-lg font-bold">{formatCurrency(month.total_income, settings.currency.symbol)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col gap-1 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">Spent</div>
            <p className="text-lg font-bold">{formatCurrency(month.total_expenses, settings.currency.symbol)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col gap-1 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">Savings</div>
            <p className="text-lg font-bold">{formatCurrency(month.savings, settings.currency.symbol)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <div className="p-4 pb-2">
          <div className="mb-2 flex justify-between text-sm">
            <span>Budget Utilization</span>
            <span className="text-muted-foreground">{month.utilization_percentage.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full transition-all ${getHealthColor(month.utilization_percentage)}`} style={{ width: `${Math.min(month.utilization_percentage, 100)}%` }} />
          </div>
        </div>
      </Card>

      {month.groups.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
          <p className="mb-2">No budget groups for this month.</p>
          <Button variant="outline" size="sm" onClick={() => { setShowGroupForm(true); setGrpName(""); setGrpBudget(""); }}><Plus className="size-4" /> Create Group</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {month.groups.map((group) => (
            <Card key={group.id} className="cursor-pointer" onClick={() => navigate(`/groups/${group.id}`)}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">{group.name}</h3>
                  <span className="text-xs text-muted-foreground">{group.utilization_percentage.toFixed(1)}%</span>
                </div>
                <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${getHealthColor(group.utilization_percentage)}`} style={{ width: `${Math.min(group.utilization_percentage, 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(group.actual_spending, settings.currency.symbol)} spent</span>
                  <span>of {formatCurrency(group.allocated_budget, settings.currency.symbol)}</span>
                </div>
                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                  <GroupChart group={group} />
                </div>
                {group.categories.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t pt-3">
                    {group.categories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1">
                          {cat.name}
                          <button className="text-primary hover:underline" onClick={(e) => { e.stopPropagation(); setShowTx({ id: cat.id, name: cat.name }); setTxAmount(""); setTxDesc(""); setTxDate(new Date().toISOString().split("T")[0]); }}>+</button>
                        </span>
                        <span className="text-muted-foreground">{formatCurrency(cat.actual_spending, settings.currency.symbol)} / {formatCurrency(cat.allocated_budget, settings.currency.symbol)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showTx && (
        <TransactionModal
          categoryName={showTx.name}
          amount={txAmount} onAmountChange={setTxAmount}
          description={txDesc} onDescriptionChange={setTxDesc}
          date={txDate} onDateChange={setTxDate}
          saving={txSaving}
          onSave={async () => {
            setTxSaving(true);
            await handleAddTransaction(showTx.id, Number(txAmount), txDesc, txDate);
            setTxSaving(false);
          }}
          onClose={() => setShowTx(null)}
        />
      )}

      <Dialog open={showGroupForm} onOpenChange={(open) => { if (!open) { setShowGroupForm(false); setGrpName(""); setGrpBudget(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Budget Group</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium text-muted-foreground">Group Name</label><Input value={grpName} onChange={(e) => setGrpName(e.target.value)} placeholder="e.g. Housing" className="mt-1" /></div>
            <div><label className="text-sm font-medium text-muted-foreground">Allocated Budget</label><Input type="number" value={grpBudget} onChange={(e) => setGrpBudget(e.target.value)} placeholder="1500" className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowGroupForm(false); setGrpName(""); setGrpBudget(""); }}>Cancel</Button>
            <Button onClick={handleCreateGroup} disabled={!grpName || !grpBudget}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
