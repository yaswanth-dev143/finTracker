import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Sun, Moon, Download, Trash2, RotateCcw, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useSettings } from "@/contexts/SettingsContext";
import { currencies } from "@/utils/currency";
import { api } from "@/utils/api";
import { exportCSV, exportXLSX } from "@/utils/export";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { settings, updateSettings, currencySymbol } = useSettings();

  const [fullName, setFullName] = useState(settings.fullName);
  const [email, setEmail] = useState(settings.email);
  const [currency, setCurrency] = useState(settings.currency.code);
  const [defaultBudget, setDefaultBudget] = useState(String(settings.defaultMonthlyBudget));
  const [autoCopy, setAutoCopy] = useState(settings.autoCopyPreviousMonth);
  const [cycleDay, setCycleDay] = useState(String(settings.budgetCycleStartDay));
  const [theme, setTheme] = useState(settings.theme);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setFullName(settings.fullName);
    setEmail(settings.email);
    setCurrency(settings.currency.code);
    setDefaultBudget(String(settings.defaultMonthlyBudget));
    setAutoCopy(settings.autoCopyPreviousMonth);
    setCycleDay(String(settings.budgetCycleStartDay));
    setTheme(settings.theme);
  }, [settings]);

  function handleSave() {
    setSaving(true);
    updateSettings({
      fullName,
      email,
      currency: currencies.find((c) => c.code === currency) ?? settings.currency,
      defaultMonthlyBudget: Number(defaultBudget) || 0,
      autoCopyPreviousMonth: autoCopy,
      budgetCycleStartDay: Math.min(31, Math.max(1, Number(cycleDay) || 1)),
      theme: theme as "light" | "dark",
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  async function handleDeleteAll() {
    setDeleting(true);
    try {
      await fetch("/api/data/clear", { method: "POST" });
      navigate("/");
    } catch { /* ignore */ }
    setDeleting(false);
    setShowDeleteConfirm(false);
  }

  async function handleExportCSV() {
    try {
      const years = await api.years.list();
      for (const y of years) {
        const data = await api.years.getData(y.id);
        exportCSV(data, y.name, currencySymbol);
      }
    } catch { /* ignore */ }
  }

  async function handleExportXLSX() {
    try {
      const years = await api.years.list();
      for (const y of years) {
        const data = await api.years.getData(y.id);
        exportXLSX(data, y.name, currencySymbol);
      }
    } catch { /* ignore */ }
  }

  function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
    return (
      <Card>
        <CardContent className="p-5">
          <h2 className="text-base font-semibold">{title}</h2>
          {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
          <div className="mt-4 space-y-4">{children}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)}><ArrowLeft className="size-4" /></Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <SectionCard title="Profile" desc="Your personal information and default currency.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Full Name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Email Address</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Default Currency</label>
          <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue>{currencies.find((c) => c.code === currency)?.label}</SelectValue></SelectTrigger>
            <SelectContent>{currencies.map((c) => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </SectionCard>

      <SectionCard title="Budget Preferences" desc="Default budgeting behavior for new months.">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Default Monthly Budget</label>
          <Input type="number" value={defaultBudget} onChange={(e) => setDefaultBudget(e.target.value)} placeholder="3000" className="sm:w-64" />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={autoCopy} onChange={(e) => setAutoCopy(e.target.checked)} className="size-4 accent-primary" />
          <div>
            <p className="text-sm font-medium">Auto Copy Previous Month Structure</p>
            <p className="text-xs text-muted-foreground">New months will copy groups, categories, and budget allocations from the previous month.</p>
          </div>
        </label>
      </SectionCard>

      <SectionCard title="Budget Cycle Settings" desc="Define when a budgeting month starts.">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Budget Cycle Start Day</label>
          <Select value={cycleDay} onValueChange={(v) => v && setCycleDay(v)}>
            <SelectTrigger className="w-full sm:w-64"><SelectValue>{cycleDay}</SelectValue></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 31 }, (_, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  Day {i + 1}{i === 0 ? " (1st)" : i === 1 ? " (2nd)" : i === 2 ? " (3rd)" : ` (${i + 1}th)`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      <SectionCard title="Appearance">
        <label className="flex items-center gap-3 cursor-pointer">
          <Switch
            checked={theme === "dark"}
            onCheckedChange={(dark) => setTheme(dark ? "dark" : "light")}
          />
          <div className="flex items-center gap-2">
            {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
            <p className="text-sm font-medium">{theme === "dark" ? "Dark Mode" : "Light Mode"}</p>
          </div>
        </label>
      </SectionCard>

      <SectionCard title="Data Management">
        <p className="text-xs text-muted-foreground">Export or delete all your budgeting data.</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}><Download className="size-3.5" /> Export CSV</Button>
          <Button variant="outline" size="sm" onClick={handleExportXLSX}><Download className="size-3.5" /> Export Excel</Button>
          <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)}><Trash2 className="size-3.5" /> Delete All Data</Button>
        </div>
      </SectionCard>

      <div className="flex items-center justify-end gap-3 pb-8">
        {saved && <span className="flex items-center gap-1 text-sm text-green-600"><Check className="size-3.5" /> Saved</span>}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <RotateCcw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Save Changes
        </Button>
      </div>

      <Dialog open={showDeleteConfirm} onOpenChange={(open) => { if (!open) setShowDeleteConfirm(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete All Data</DialogTitle>
            <DialogDescription>
              This will permanently delete all years, months, groups, categories, and transactions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAll} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete Everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
