import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Truck, LogOut, User, ClipboardList, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHealthCheck } from "@workspace/api-client-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Used just to satisfy requirement that all hooks must be used.
  const { data: health } = useHealthCheck();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={user?.role === "driver" ? "/driver" : "/"} className="flex items-center gap-2 font-bold text-xl text-primary tracking-tight">
            <Truck className="h-6 w-6" />
            <span>TruckGo</span>
          </Link>
          {health?.status === "ok" && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-medium text-emerald-700 uppercase tracking-wider">System Operational</span>
            </div>
          )}
        </div>

        {user ? (
          <nav className="flex items-center gap-4 sm:gap-6">
            {user.role === "customer" && (
              <>
                <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Book Truck
                </Link>
                <Link href="/bookings" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4" />
                  <span className="hidden sm:inline">My Bookings</span>
                </Link>
                <Link href="/profile" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </>
            )}
            
            {user.role === "driver" && (
              <>
                <Link href="/driver" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <Link href="/driver/jobs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4" />
                  <span className="hidden sm:inline">Jobs</span>
                </Link>
              </>
            )}
            
            <div className="h-4 w-px bg-border mx-1"></div>
            
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </nav>
        ) : (
          <nav className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
              Log In
            </Link>
            <Button asChild size="sm">
              <Link href="/register">Sign Up</Link>
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
