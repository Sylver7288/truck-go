import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Truck, LogOut, ClipboardList, LayoutDashboard, User, Menu, X, HelpCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

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

          {/* Nav links — desktop */}
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
            {/* Public links always visible */}
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

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/6 transition-all"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center ring-1 ring-primary/30">
                    {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline">{user.name.split(" ")[0]}</span>
                </Link>
                <div className="w-px h-5 bg-white/10 hidden sm:block" />
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </button>
                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/6 transition-all"
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white rounded-lg hover:bg-white/6 transition-all"
                >
                  Log in
                </Link>
                <Button asChild size="sm" className="font-semibold shadow-lg shadow-primary/30 btn-glow transition-all">
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
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
          {user && (
            <>
              <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/6 transition-all">
                <User className="h-4 w-4" /> Profile
              </Link>
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
