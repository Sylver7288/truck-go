import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Truck, LogOut, ClipboardList, LayoutDashboard, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CUSTOMER_NAV = [
  { href: "/", label: "Book a Truck" },
  { href: "/bookings", label: "My Bookings", icon: ClipboardList },
];

const DRIVER_NAV = [
  { href: "/driver", label: "Dashboard", icon: LayoutDashboard },
  { href: "/driver/jobs", label: "Jobs", icon: ClipboardList },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const navItems = user?.role === "driver" ? DRIVER_NAV : user?.role === "customer" ? CUSTOMER_NAV : [];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-8">

          {/* Logo */}
          <Link
            href={user?.role === "driver" ? "/driver" : "/"}
            className="flex items-center gap-2.5 shrink-0"
          >
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <Truck className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">TruckGo</span>
            {user?.role === "driver" && (
              <span className="hidden sm:inline text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 ml-1">
                Driver
              </span>
            )}
          </Link>

          {/* Nav links */}
          {user && navItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-1 flex-1">
              {navItems.map((item) => {
                const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "text-primary bg-primary/8 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    )}
                  >
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                    {user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline">{user.name.split(" ")[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </Link>
                <div className="w-px h-5 bg-slate-200 hidden sm:block" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Log in
                </Link>
                <Button asChild size="sm" className="font-semibold shadow-sm">
                  <Link href="/register">Get started</Link>
                </Button>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
