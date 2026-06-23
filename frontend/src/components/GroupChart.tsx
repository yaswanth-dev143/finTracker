import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  AreaChart, Area,
} from "recharts";
import { BarChart3, PieChart as PieIcon, TrendingUp, Radar as RadarIcon, Activity } from "lucide-react";
import type { GroupWithUtilization } from "@/types";

const CHART_TYPES = [
  { value: "bar", label: "Bar", icon: BarChart3 },
  { value: "pie", label: "Pie", icon: PieIcon },
  { value: "line", label: "Line", icon: TrendingUp },
  { value: "radar", label: "Radar", icon: RadarIcon },
  { value: "area", label: "Area", icon: Activity },
] as const;

type ChartType = (typeof CHART_TYPES)[number]["value"];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

interface Props {
  group: GroupWithUtilization;
}

export default function GroupChart({ group }: Props) {
  const [type, setType] = useState<ChartType>("bar");

  const chartData = group.categories.map((cat) => ({
    name: cat.name,
    budget: Number(cat.allocated_budget),
    actual: Number(cat.actual_spending),
    utilization: Number(cat.utilization_percentage),
    remaining: Math.max(0, Number(cat.allocated_budget) - Number(cat.actual_spending)),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        Add categories to see charts
      </div>
    );
  }

  const tickStyle = { fontSize: 11, fill: "var(--color-muted-foreground, #888)" };

  const charts: Record<ChartType, React.ReactNode> = {
    bar: (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
          <XAxis dataKey="name" tick={tickStyle} />
          <YAxis tick={tickStyle} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="budget" name="Budget" fill="#3b82f6" radius={[3, 3, 0, 0]} />
          <Bar dataKey="actual" name="Actual" fill="#f97316" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    ),
    pie: (
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="actual"
            nameKey="name"
            cx="50%" cy="50%"
            outerRadius={72}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    ),
    line: (
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
          <XAxis dataKey="name" tick={tickStyle} />
          <YAxis tick={tickStyle} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="budget" name="Budget" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="actual" name="Actual" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    ),
    radar: (
      <ResponsiveContainer width="100%" height={220}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="65%">
          <PolarGrid stroke="var(--color-border, #e5e7eb)" />
          <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--color-muted-foreground, #888)" }} />
          <Radar name="Utilization %" dataKey="utilization" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    ),
    area: (
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e5e7eb)" />
          <XAxis dataKey="name" tick={tickStyle} />
          <YAxis tick={tickStyle} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="budget" name="Budget" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
          <Area type="monotone" dataKey="actual" name="Actual" stroke="#f97316" fill="#f97316" fillOpacity={0.15} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    ),
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1">
        {CHART_TYPES.map((ct) => (
          <button
            key={ct.value}
            onClick={() => setType(ct.value)}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
              type === ct.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <ct.icon className="size-3.5" />
            <span className="hidden sm:inline">{ct.label}</span>
          </button>
        ))}
      </div>
      {charts[type]}
    </div>
  );
}
