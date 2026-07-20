import { Link, useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  LayoutDashboard,
  ClipboardList,
  Truck,
  Users,
  MessageSquare,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/bookings", label: "Bookings", icon: ClipboardList },
  { href: "/admin/drivers", label: "Drivers", icon: Truck },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location, setLocation] = useLocation();
  const { logout } = useAdminAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/admin/login");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-slate-700">
        <Link href="/admin" className="flex items-center gap-2.5" onClick={onNavigate}>
          <ShieldCheck className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg text-white tracking-tight">TruckGo Admin</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.exact
            ? location === item.href
            : location.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/60"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-slate-700 pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-slate-900 border-r border-slate-700">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-slate-900 border-r border-slate-700 z-10">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-700 bg-slate-900">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5 text-slate-400" />
          </button>
          <span className="font-semibold text-white">TruckGo Admin</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
