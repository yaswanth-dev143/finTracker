import type { Transaction } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  categoryName: string;
  editTx?: Transaction | null;
  amount: string;
  description: string;
  date: string;
  saving: boolean;
  onAmountChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function TransactionModal({
  categoryName, editTx, amount, description, date, saving,
  onAmountChange, onDescriptionChange, onDateChange,
  onSave, onClose,
}: Props) {
  const valid = amount && description && date;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{editTx ? "Edit Transaction" : "Add Transaction"}</DialogTitle>
          <DialogDescription>in {categoryName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">

          <div>
            <label className="text-sm font-medium text-muted-foreground">Amount</label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => onAmountChange(e.target.value)} placeholder="0.00" className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            <Input value={description} onChange={(e) => onDescriptionChange(e.target.value)} placeholder="e.g. Monthly rent payment" className="mt-1" />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">Date</label>
            <Input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} className="mt-1" />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave} disabled={saving || !valid}>
            {saving ? "Saving..." : editTx ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
