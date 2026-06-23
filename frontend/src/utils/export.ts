import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface TxRow {
  Month: string;
  Group: string;
  Category: string;
  Description: string;
  Amount: number;
  Date: string;
}

interface CatRow {
  Month: string;
  Group: string;
  Category: string;
  Budget: number;
  Actual: number;
  Remaining: number;
  Utilization: string;
}

interface GroupRow {
  Month: string;
  Group: string;
  Budget: number;
  Actual: number;
  Remaining: number;
  Utilization: string;
}

interface MonthlyRow {
  Month: string;
  Budget: number;
  Expenses: number;
  Remaining: number;
  Utilization: string;
}

function flatRows(data: any) {
  const transactions: TxRow[] = [];
  const categories: CatRow[] = [];
  const groups: GroupRow[] = [];
  const months: MonthlyRow[] = [];

  for (const m of data.months) {
    months.push({
      Month: m.name,
      Budget: m.total_budget,
      Expenses: m.total_expenses,
      Remaining: m.remaining_budget,
      Utilization: `${m.utilization_percentage}%`,
    });

    for (const g of m.groups) {
      groups.push({
        Month: m.name,
        Group: g.name,
        Budget: g.allocated_budget,
        Actual: g.actual_spending,
        Remaining: g.remaining_budget,
        Utilization: `${g.utilization_percentage}%`,
      });

      for (const c of g.categories) {
        categories.push({
          Month: m.name,
          Group: g.name,
          Category: c.name,
          Budget: c.allocated_budget,
          Actual: c.actual_spending,
          Remaining: c.remaining_budget,
          Utilization: `${c.utilization_percentage}%`,
        });

        for (const t of c.transactions) {
          transactions.push({
            Month: m.name,
            Group: g.name,
            Category: c.name,
            Description: t.description,
            Amount: t.amount,
            Date: t.date,
          });
        }
      }
    }
  }

  return { transactions, categories, groups, months };
}

export function exportCSV(data: any, yearName: string, _symbol?: string) {
  const { transactions, categories, groups, months } = flatRows(data);

  const wb = XLSX.utils.book_new();

  const sheets: [string, any[]][] = [
    ["Monthly Summary", months],
    ["Groups", groups],
    ["Categories", categories],
    ["Transactions", transactions],
  ];

  for (const [name, rows] of sheets) {
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  XLSX.writeFile(wb, `budget-${yearName}.csv`, { bookType: "csv" });
}

export function exportXLSX(data: any, yearName: string, _symbol?: string) {
  const { transactions, categories, groups, months } = flatRows(data);

  const wb = XLSX.utils.book_new();

  const sheets: [string, any[]][] = [
    ["Monthly Summary", months],
    ["Groups", groups],
    ["Categories", categories],
    ["Transactions", transactions],
  ];

  for (const [name, rows] of sheets) {
    const ws = XLSX.utils.json_to_sheet(rows);

    const colWidths = rows.length > 0
      ? Object.keys(rows[0]).map((k) => ({
          wch: Math.max(k.length, ...rows.map((r: any) => String(r[k] ?? "").length)) + 2,
        }))
      : [];
    ws["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  XLSX.writeFile(wb, `budget-${yearName}.xlsx`);
}

export function exportPDF(data: any, yearName: string, symbol = "$") {
  const { transactions, categories, groups, months } = flatRows(data);

  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text(`Budget Report - ${yearName}`, pageW / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Total Budget: ${symbol}${data.summary.total_budget.toFixed(2)}`, 14, 32);
  doc.text(`Total Expenses: ${symbol}${data.summary.total_expenses.toFixed(2)}`, 14, 40);
  doc.text(`Remaining: ${symbol}${data.summary.remaining_budget.toFixed(2)}`, 14, 48);
  doc.text(`Utilization: ${data.summary.utilization_percentage}%`, 14, 56);

  let y = 68;

  if (months.length > 0) {
    doc.setFontSize(14);
    doc.text("Monthly Summary", 14, y);
    y += 6;
    (doc as any).autoTable({
      startY: y,
      head: [["Month", "Budget", "Expenses", "Remaining", "Utilization"]],
      body: months.map((r: any) => [
        r.Month,
        `${symbol}${r.Budget.toFixed(2)}`,
        `${symbol}${r.Expenses.toFixed(2)}`,
        `${symbol}${r.Remaining.toFixed(2)}`,
        r.Utilization,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  if (groups.length > 0) {
    doc.setFontSize(14);
    doc.text("Groups Breakdown", 14, y);
    y += 6;
    (doc as any).autoTable({
      startY: y,
      head: [["Month", "Group", "Budget", "Actual", "Remaining", "Utilization"]],
      body: groups.map((r: any) => [
        r.Month, r.Group,
        `${symbol}${r.Budget.toFixed(2)}`,
        `${symbol}${r.Actual.toFixed(2)}`,
        `${symbol}${r.Remaining.toFixed(2)}`,
        r.Utilization,
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  if (transactions.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.text("All Transactions", 14, y);
    y += 6;
    (doc as any).autoTable({
      startY: y,
      head: [["Month", "Group", "Category", "Description", "Amount", "Date"]],
      body: transactions.map((r: any) => [
        r.Month, r.Group, r.Category, r.Description,
        `${symbol}${r.Amount.toFixed(2)}`,
        r.Date,
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] },
    });
  }

  doc.save(`budget-${yearName}.pdf`);
}
