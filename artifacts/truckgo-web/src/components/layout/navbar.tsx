import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Truck, LogOut, ClipboardList, LayoutDashboard, User, Menu, X, HelpCircle, Mail, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import type { Theme } from "@/hooks/use-theme";

const CUSTOMER_NAV = [
  { href: "/", label: "Book a Truck" },
  { href: "/bookings", label: "My Bookings", icon: ClipboardList },
];

const DRIVER_NAV = [
  { href: "/driver", label: "Dashboard", icon: LayoutDashboard },
  { href: "/driver/jobs", label: "Jobs", icon: ClipboardList },
];

const PUBLIC_NAV = [
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/contact", label: "Contact", icon: Mail },
];

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light",  icon: Sun,     label: "Light"  },
  { value: "dark",   icon: Moon,    label: "Dark"   },
  { value: "system", icon: Monitor, label: "System" },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = THEME_OPTIONS.find(o => o.value === theme) ?? THEME_OPTIONS[1];
  const Icon = current.icon;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        title="Change theme"
        className={cn(
          "p-2 rounded-lg transition-all text-white/55 hover:text-white hover:bg-white/8",
          open && "bg-white/8 text-white"
        )}
      >
        <Icon className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 min-w-[130px] rounded-xl border border-white/10 shadow-xl overflow-hidden"
          style={{ background: "rgba(12,13,26,0.97)", backdropFilter: "blur(20px)" }}>
          {THEME_OPTIONS.map(({ value, icon: OptionIcon, label }) => (
            <button
              key={value}
              onClick={() => { setTheme(value); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all",
                theme === value
                  ? "text-primary bg-primary/10 font-semibold"
                  : "text-white/60 hover:text-white hover:bg-white/6"
              )}
            >
              <OptionIcon className="h-3.5 w-3.5" />
              {label}
              {theme === value && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setLocation("/login");
    setMobileOpen(false);
  };

  const navItems = user?.role === "driver" ? DRIVER_NAV : user?.role === "customer" ? CUSTOMER_NAV : [];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/8" style={{ background: 'rgba(7,8,15,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-8">

          {/* Logo */}
          <Link
            href={user?.role === "driver" ? "/driver" : "/"}
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/30 transition-shadow group-hover:shadow-primary/50">
              <Truck className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">TruckGo</span>
            {user?.role === "driver" && (
              <span className="hidden sm:inline text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 ml-1">
                Driver
              </span>
            )}
          </Link>

          {/* Nav links — desktop (role-specific) */}
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {(user ? navItems : []).map((item) => {
              const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "text-primary bg-primary/10 font-semibold"
                      : "text-white/60 hover:text-white hover:bg-white/6"
                  )}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </Link>
              );
            })}
            {/* Public links — desktop */}
            {PUBLIC_NAV.map((item) => {
              const isActive = location.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive
                      ? "text-primary bg-primary/10 font-semibold"
                      : "text-white/60 hover:text-white hover:bg-white/6"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Public links — always visible on mobile */}
          <nav className="flex md:hidden items-center gap-1">
            {PUBLIC_NAV.map((item) => {
              const isActive = location.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-white/55 hover:text-white hover:bg-white/6"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/6 transition-all"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center ring-1 ring-primary/30">
                    {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline">{user.name.split(" ")[0]}</span>
                </Link>
                <div className="w-px h-5 bg-white/10 hidden md:block" />
                <button
                  onClick={handleLogout}
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden md:block px-4 py-2 text-sm font-medium text-white/60 hover:text-white rounded-lg hover:bg-white/6 transition-all"
                >
                  Log in
                </Link>
                <Button asChild size="sm" className="hidden md:inline-flex font-semibold shadow-lg shadow-primary/30 btn-glow transition-all">
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
            {/* Theme toggle — always visible */}
            <ThemeToggle />
            {/* Hamburger — always visible on mobile */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/6 transition-all"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/8 px-4 py-4 space-y-1" style={{ background: 'rgba(7,8,15,0.95)' }}>
          {user && navItems.map((item) => {
            const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive ? "text-primary bg-primary/10" : "text-white/70 hover:text-white hover:bg-white/6"
                )}
              >
                {item.icon && <item.icon className="h-4 w-4" />}
                {item.label}
              </Link>
            );
          })}
          {/* Public links */}
          {PUBLIC_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                location.startsWith(item.href) ? "text-primary bg-primary/10" : "text-white/70 hover:text-white hover:bg-white/6"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/6 transition-all">
                <User className="h-4 w-4" /> Profile
              </Link>
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </>
          ) : (
            <div className="pt-2 flex flex-col gap-2 border-t border-white/8 mt-1">
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center h-10 rounded-lg border border-white/12 text-sm font-semibold text-white/70 hover:text-white hover:bg-white/6 transition-all">
                Log in
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center h-10 rounded-lg bg-primary text-sm font-semibold text-white shadow-lg shadow-primary/25 btn-glow transition-all">
                Get started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
