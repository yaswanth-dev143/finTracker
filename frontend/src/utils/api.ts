import type { Year, Month, MonthSummary, BudgetGroup, GroupDetail, Category, CategoryDetail, Transaction } from "../types";

export interface DashboardSummary {
  year_count: number;
  month_count: number;
  total_transactions: number;
  avg_monthly_spending: number;
  highest_spend_month: { name: string; amount: number } | null;
  lowest_spend_month: { name: string; amount: number } | null;
  months_over_budget: number;
  highest_spend_group: { name: string; amount: number; month: string } | null;
  most_utilized_category: { name: string; utilization: number; month: string } | null;
  least_utilized_category: { name: string; utilization: number; month: string } | null;
}

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const api = {
  dashboard: {
    summary: () => request<DashboardSummary>("/dashboard/summary"),
  },
  years: {
    list: () => request<Year[]>("/years"),
    getData: (id: number) => request<any>(`/years/${id}/data`),
    create: (data: { name: string }) =>
      request<Year>("/years", { method: "POST", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/years/${id}`, { method: "DELETE" }),
  },
  months: {
    list: () => request<Month[]>("/months"),
    listByYear: (yearId: number) => request<Month[]>(`/months?year_id=${yearId}`),
    get: (id: number) => request<MonthSummary>(`/months/${id}`),
    create: (data: { year_id: number; name: string; total_budget: number }) =>
      request<Month>("/months", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<{ name: string; total_budget: number }>) =>
      request<Month>(`/months/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/months/${id}`, { method: "DELETE" }),
    copy: (id: number, newMonthName: string) =>
      request<Month>(`/months/${id}/copy`, {
        method: "POST",
        body: JSON.stringify({ newMonthName }),
      }),
  },
  groups: {
    listByMonth: (monthId: number) =>
      request<GroupDetail[]>(`/groups/month/${monthId}`),
    get: (id: number) => request<GroupDetail>(`/groups/${id}`),
    create: (data: { month_id: number; name: string; allocated_budget: number }) =>
      request<BudgetGroup>("/groups", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<{ name: string; allocated_budget: number }>) =>
      request<BudgetGroup>(`/groups/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/groups/${id}`, { method: "DELETE" }),
  },
  categories: {
    listByGroup: (groupId: number) =>
      request<Category[]>(`/categories/group/${groupId}`),
    get: (id: number) => request<CategoryDetail>(`/categories/${id}`),
    create: (data: { group_id: number; name: string; allocated_budget: number }) =>
      request<Category>("/categories", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<{ name: string; allocated_budget: number }>) =>
      request<Category>(`/categories/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/categories/${id}`, { method: "DELETE" }),
  },
  transactions: {
    listByCategory: (categoryId: number) =>
      request<Transaction[]>(`/transactions/category/${categoryId}`),
    create: (data: {
      category_id: number;
      amount: number;
      type: "income" | "expense";
      description: string;
      date: string;
    }) =>
      request<Transaction>("/transactions", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: Partial<{ amount: number; type: "income" | "expense"; description: string; date: string }>) =>
      request<Transaction>(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) =>
      request<{ success: boolean }>(`/transactions/${id}`, { method: "DELETE" }),
  },
};
