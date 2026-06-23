import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { currencies, type Currency } from "@/utils/currency";

interface Settings {
  fullName: string;
  email: string;
  currency: Currency;
  defaultMonthlyBudget: number;
  autoCopyPreviousMonth: boolean;
  budgetCycleStartDay: number;
  theme: "light" | "dark" | "system";
}

interface SettingsContextValue {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  currencySymbol: string;
}

const defaults: Settings = {
  fullName: "",
  email: "",
  currency: currencies.find((c) => c.code === "USD")!,
  defaultMonthlyBudget: 0,
  autoCopyPreviousMonth: false,
  budgetCycleStartDay: 1,
  theme: "light",
};

function loadSettings(): Settings {
  const raw = localStorage.getItem("settings");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        fullName: parsed.fullName ?? defaults.fullName,
        email: parsed.email ?? defaults.email,
        currency: currencies.find((c: any) => c.code === parsed.currency) ?? defaults.currency,
        defaultMonthlyBudget: parsed.defaultMonthlyBudget ?? defaults.defaultMonthlyBudget,
        autoCopyPreviousMonth: parsed.autoCopyPreviousMonth ?? defaults.autoCopyPreviousMonth,
        budgetCycleStartDay: parsed.budgetCycleStartDay ?? defaults.budgetCycleStartDay,
        theme: parsed.theme ?? defaults.theme,
      };
    } catch { /* fall through */ }
  }
  const legacy = localStorage.getItem("theme");
  if (legacy === "dark" || legacy === "light") {
    return { ...defaults, theme: legacy };
  }
  return defaults;
}

function applyTheme(theme: "light" | "dark" | "system") {
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    const toStore = { ...settings, currency: settings.currency.code };
    localStorage.setItem("settings", JSON.stringify(toStore));
    applyTheme(settings.theme);
  }, [settings]);

  useEffect(() => {
    if (settings.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.theme]);

  const updateSettings = (partial: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, currencySymbol: settings.currency.symbol }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
