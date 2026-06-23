import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Edit3, Trash2, Wallet, TrendingDown, PiggyBank, PieChart } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { api } from "@/utils/api";
import type { GroupDetail as GroupDetailType } from "@/types";
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

export default function GroupDetailPage() {
  const { settings } = useSettings();
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBudget, setEditBudget] = useState("");

  const [showNewCat, setShowNewCat] = useState(false);
  const [ncName, setNcName] = useState("");
  const [ncBudget, setNcBudget] = useState("");

  const [showTx, setShowTx] = useState<{ id: number; name: string } | null>(null);

  const [delTarget, setDelTarget] = useState<{ id: number; type: "group" | "category" } | null>(null);
  const [txAmount, setTxAmount] = useState("");
  const [txDesc, setTxDesc] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);
  const [txSaving, setTxSaving] = useState(false);

  async function loadGroup() {
    if (!groupId) return;
    setLoading(true);
    try {
      setGroup(await api.groups.get(Number(groupId)));
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  useEffect(() => { loadGroup(); }, [groupId]);

  async function handleUpdateGroup(id: number, name: string, budget: number) {
    await api.groups.update(id, { name, allocated_budget: budget });
    await loadGroup();
    setShowEdit(false);
  }

  async function handleDeleteGroup(id: number) {
    await api.groups.delete(id);
    setDelTarget(null);
    if (group) navigate(`/months/${group.month_id}`);
  }

  async function handleCreateCategory(groupId: number, name: string, budget: number) {
    await api.categories.create({ group_id: groupId, name, allocated_budget: budget });
    await loadGroup();
    setShowNewCat(false);
    setNcName("");
    setNcBudget("");
  }

  async function handleDeleteCategory(id: number) {
    await api.categories.delete(id);
    setDelTarget(null);
    loadGroup();
  }

  async function handleAddTransaction(categoryId: number, amount: number, description: string, date: string) {
    await api.transactions.create({ category_id: categoryId, amount, type: "expense", description, date });
    await loadGroup();
    setShowTx(null);
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

  if (!group) {
    return (
      <div className="flex flex-col items-center py-20 text-center text-muted-foreground">
        <p>Group not found</p>
        <Button className="mt-4" onClick={() => navigate("/")}>Back to Dashboard</Button>
      </div>
    );
  }

  const stats = [
    { label: "Budget Allocated", value: formatCurrency(Number(group.allocated_budget), settings.currency.symbol), icon: Wallet, color: "text-primary" },
    { label: "Amount Spent", value: formatCurrency(group.actual_spending, settings.currency.symbol), icon: TrendingDown, color: "text-red-500" },
    { label: "Remaining", value: formatCurrency(group.remaining_budget, settings.currency.symbol), icon: PiggyBank, color: "text-yellow-500" },
    { label: "Utilization", value: `${group.utilization_percentage.toFixed(1)}%`, icon: PieChart, color: getHealthColor(group.utilization_percentage).replace("bg", "text") },
  ];

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={() => navigate(-1 as any)}><ArrowLeft className="size-3.5" /> Back</Button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => { setShowEdit(true); setEditName(group.name); setEditBudget(String(group.allocated_budget)); }}><Edit3 className="size-3.5" /> Edit</Button>
          <Button size="sm" variant="destructive" onClick={() => setDelTarget({ id: group.id, type: "group" })}><Trash2 className="size-3.5" /> Delete</Button>
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
            <span className="text-muted-foreground">{formatCurrency(group.actual_spending, settings.currency.symbol)} / {formatCurrency(Number(group.allocated_budget), settings.currency.symbol)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className={`h-full rounded-full transition-all ${getHealthColor(group.utilization_percentage)}`} style={{ width: `${Math.min(group.utilization_percentage, 100)}%` }} />
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between p-4 pb-2">
          <h2 className="text-lg font-semibold">Categories</h2>
          <Button size="sm" onClick={() => { setShowNewCat(true); setNcName(""); setNcBudget(""); }}><Plus className="size-3.5" /> Add Category</Button>
        </div>
        {group.categories.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
            <p className="mb-3">No categories in this group.</p>
            <Button size="sm" onClick={() => { setShowNewCat(true); setNcName(""); setNcBudget(""); }}><Plus className="size-3.5" /> Create Category</Button>
          </div>
        ) : (
          <div className="p-4 pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.categories.map((cat) => (
                  <TableRow key={cat.id} className="cursor-pointer" onClick={() => navigate(`/categories/${cat.id}`)}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>{formatCurrency(cat.allocated_budget, settings.currency.symbol)}</TableCell>
                    <TableCell>{formatCurrency(cat.actual_spending, settings.currency.symbol)}</TableCell>
                    <TableCell>{formatCurrency(cat.remaining_budget, settings.currency.symbol)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-full max-w-24 overflow-hidden rounded-full bg-muted">
                          <div className={`h-full rounded-full ${getHealthColor(cat.utilization_percentage)}`} style={{ width: `${Math.min(cat.utilization_percentage, 100)}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{cat.utilization_percentage.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button size="xs" variant="outline" onClick={() => { setShowTx({ id: cat.id, name: cat.name }); }}>+ Tx</Button>
                        <Button size="xs" variant="destructive" onClick={() => setDelTarget({ id: cat.id, type: "category" })}><Trash2 className="size-3" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Dialog open={showEdit} onOpenChange={(open) => { if (!open) setShowEdit(false); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Group</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium text-muted-foreground">Group Name</label><Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" /></div>
            <div><label className="text-sm font-medium text-muted-foreground">Allocated Budget</label><Input type="number" value={editBudget} onChange={(e) => setEditBudget(e.target.value)} className="mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button><Button onClick={() => handleUpdateGroup(group.id, editName, Number(editBudget))}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewCat} onOpenChange={(open) => { if (!open) { setShowNewCat(false); setNcName(""); setNcBudget(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium text-muted-foreground">Category Name</label><Input value={ncName} onChange={(e) => setNcName(e.target.value)} placeholder="e.g. Groceries" className="mt-1" /></div>
            <div><label className="text-sm font-medium text-muted-foreground">Allocated Budget</label><Input type="number" value={ncBudget} onChange={(e) => setNcBudget(e.target.value)} placeholder="500" className="mt-1" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => { setShowNewCat(false); setNcName(""); setNcBudget(""); }}>Cancel</Button><Button onClick={() => handleCreateCategory(group.id, ncName, Number(ncBudget) || 0)}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={delTarget !== null}
        title={delTarget?.type === "group" ? "Delete Group" : "Delete Category"}
        message={delTarget?.type === "group" ? "Delete this group and all its data?" : "Delete this category?"}
        onConfirm={() => delTarget!.type === "group" ? handleDeleteGroup(delTarget!.id) : handleDeleteCategory(delTarget!.id)}
        onCancel={() => setDelTarget(null)}
      />

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
    </div>
  );
}
