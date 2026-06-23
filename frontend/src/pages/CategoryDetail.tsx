import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit3, Trash2, Wallet, TrendingDown, PiggyBank, PieChart } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { api } from "@/utils/api";
import type { CategoryDetail as CategoryDetailType } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import TransactionModal from "@/components/TransactionModal";
import { useSettings } from "@/contexts/SettingsContext";
import { formatCurrency } from "@/utils/currency";

function getHealthColor(pct: number) {
  if (pct >= 100) return "bg-red-500";
  if (pct >= 80) return "bg-yellow-500";
  return "bg-green-500";
}

export default function CategoryDetailPage() {
  const { settings } = useSettings();
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<CategoryDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBudget, setEditBudget] = useState("");

  const [showTx, setShowTx] = useState(false);

  const [delTarget, setDelTarget] = useState<{ id: number; type: "category" | "transaction" } | null>(null);
  const [txAmount, setTxAmount] = useState("");
  const [txDesc, setTxDesc] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [txSaving, setTxSaving] = useState(false);

  async function loadCategory() {
    if (!categoryId) return;
    setLoading(true);
    try {
      setCategory(await api.categories.get(Number(categoryId)));
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  useEffect(() => { loadCategory(); }, [categoryId]);

  async function handleUpdateCategory(id: number, name: string, budget: number) {
    await api.categories.update(id, { name, allocated_budget: budget });
    await loadCategory();
    setShowEdit(false);
  }

  async function handleDeleteCategory(id: number) {
    await api.categories.delete(id);
    setDelTarget(null);
    navigate(-1 as any);
  }

  async function handleAddTransaction(categoryId: number, amount: number, description: string, date: string) {
    await api.transactions.create({ category_id: categoryId, amount, type: "expense", description, date });
    await loadCategory();
    setShowTx(false);
  }

  async function handleDeleteTransaction(id: number) {
    await api.transactions.delete(id);
    setDelTarget(null);
    loadCategory();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex flex-col items-center py-20 text-center text-muted-foreground">
        <p>Category not found</p>
        <Button className="mt-4" onClick={() => navigate("/")}>Back to Dashboard</Button>
      </div>
    );
  }

  const stats = [
    { label: "Allocated", value: formatCurrency(category.allocated_budget, settings.currency.symbol), icon: Wallet, color: "text-primary" },
    { label: "Spent", value: formatCurrency(category.actual_spending, settings.currency.symbol), icon: TrendingDown, color: "text-red-500" },
    { label: "Remaining", value: formatCurrency(category.remaining_budget, settings.currency.symbol), icon: PiggyBank, color: "text-yellow-500" },
    { label: "Utilization", value: `${category.utilization_percentage.toFixed(1)}%`, icon: PieChart, color: getHealthColor(category.utilization_percentage).replace("bg", "text") },
  ];

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={() => navigate(-1 as any)}><ArrowLeft className="size-3.5" /> Back</Button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{category.name}</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setShowEdit(true); setEditName(category.name); setEditBudget(String(category.allocated_budget)); }}><Edit3 className="size-3.5" /> Edit</Button>
          <Button size="sm" variant="destructive" onClick={() => setDelTarget({ id: category.id, type: "category" })}><Trash2 className="size-3.5" /> Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} size="sm">
            <CardContent className="flex flex-col gap-1 p-3">
              <div className="flex items-center gap-1.5">
                <s.icon className={`size-3.5 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-lg font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-4 pb-2">
          <div className="mb-2 flex justify-between text-sm">
            <span>Budget vs Actual</span>
            <span className="text-muted-foreground">{formatCurrency(category.actual_spending, settings.currency.symbol)} / {formatCurrency(category.allocated_budget, settings.currency.symbol)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full transition-all ${getHealthColor(category.utilization_percentage)}`} style={{ width: `${Math.min(category.utilization_percentage, 100)}%` }} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="text-lg font-semibold">Transactions</h2>
          <Button size="sm" onClick={() => setShowTx(true)}>+ Add Transaction</Button>
        </div>
        {category.transactions.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
            <p className="mb-3">No transactions yet.</p>
            <Button size="sm" onClick={() => setShowTx(true)}>+ Add Transaction</Button>
          </div>
        ) : (
          <div className="p-4 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell className="text-red-500">{formatCurrency(Number(tx.amount), settings.currency.symbol)}</TableCell>
                    <TableCell><Button size="xs" variant="destructive" onClick={() => setDelTarget({ id: tx.id, type: "transaction" })}><Trash2 className="size-3" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={showEdit} onOpenChange={(open) => { if (!open) setShowEdit(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium text-muted-foreground">Category Name</label><Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" /></div>
            <div><label className="text-sm font-medium text-muted-foreground">Allocated Budget</label><Input type="number" value={editBudget} onChange={(e) => setEditBudget(e.target.value)} className="mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button><Button onClick={() => handleUpdateCategory(category.id, editName, Number(editBudget))}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={delTarget !== null}
        title={delTarget?.type === "category" ? "Delete Category" : "Delete Transaction"}
        message={delTarget?.type === "category" ? "Delete this category and all transactions?" : "Delete this transaction?"}
        onConfirm={() => delTarget!.type === "category" ? handleDeleteCategory(delTarget!.id) : handleDeleteTransaction(delTarget!.id)}
        onCancel={() => setDelTarget(null)}
      />

      {showTx && (
        <TransactionModal
          categoryName={category.name}
          amount={txAmount} onAmountChange={setTxAmount}
          description={txDesc} onDescriptionChange={setTxDesc}
          date={txDate} onDateChange={setTxDate}
          saving={txSaving}
          onSave={async () => {
            setTxSaving(true);
            await handleAddTransaction(category.id, Number(txAmount), txDesc, txDate);
            setTxSaving(false);
          }}
          onClose={() => setShowTx(false)}
        />
      )}
    </div>
  );
}
