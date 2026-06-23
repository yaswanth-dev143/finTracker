import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Home, CalendarDays, Menu, X, DollarSign, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/years", icon: CalendarDays, label: "Years" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-card">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <DollarSign className="size-5 text-primary" />
            FinTracker
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to}>
                  <Button variant={active ? "default" : "ghost"} size="sm">
                    <item.icon className="size-3.5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <Button variant="ghost" size="sm" className="sm:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>

        {menuOpen && (
          <div className="border-b bg-card px-4 pb-3 sm:hidden">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
                  <Button variant={active ? "default" : "ghost"} size="sm" className="w-full justify-start">
                    <item.icon className="size-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
