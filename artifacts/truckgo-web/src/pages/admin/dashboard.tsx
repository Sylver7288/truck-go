import { useGetAdminStats, useListAdminBookings } from "@workspace/api-client-react";
import { AdminLayout } from "./layout";
import { formatCurrency, formatDate, getStatusBadgeVariant } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  DollarSign,
  Truck,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent?: string;
  sub?: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 flex items-start gap-4">
      <div className={cn("p-2.5 rounded-lg", accent ?? "bg-slate-800")}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-400 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-400 bg-amber-950/50 border-amber-800",
  accepted: "text-blue-400 bg-blue-950/50 border-blue-800",
  in_progress: "text-orange-400 bg-orange-950/50 border-orange-800",
  completed: "text-emerald-400 bg-emerald-950/50 border-emerald-800",
  cancelled: "text-red-400 bg-red-950/50 border-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function AdminDashboard() {
  const { data: rawStats, isLoading: statsLoading } = useGetAdminStats();
  const { data: bookings, isLoading: bookingsLoading } = useListAdminBookings();

  const stats = rawStats && typeof rawStats === "object" ? rawStats : null;
  const recentBookings = Array.isArray(bookings) ? bookings.slice(0, 8) : [];

  return (
    <AdminLayout>
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Platform overview at a glance</p>
        </div>

        {/* Stats grid */}
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 bg-slate-800 rounded-xl" />
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Bookings" value={stats.totalBookings} icon={Package} accent="bg-primary" />
              <StatCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} accent="bg-emerald-700" />
              <StatCard label="Active Jobs" value={stats.activeBookings} icon={Activity} accent="bg-orange-700" sub={`${stats.pendingBookings} pending`} />
              <StatCard label="Completed" value={stats.completedBookings} icon={CheckCircle2} accent="bg-blue-700" sub={`${stats.cancelledBookings} cancelled`} />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label="Total Drivers" value={stats.totalDrivers} icon={Truck} accent="bg-violet-700" sub={`${stats.availableDrivers} available · ${stats.busyDrivers} on job`} />
              <StatCard label="Customers" value={stats.totalCustomers} icon={Users} accent="bg-slate-600" />
              <StatCard label="Pending Requests" value={stats.pendingBookings} icon={Clock} accent="bg-amber-700" sub="awaiting driver acceptance" />
            </div>
          </>
        ) : null}

        {/* Booking breakdown */}
        {stats && (
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Booking Breakdown
            </h2>
            <div className="flex flex-col gap-2">
              {[
                { label: "Completed", value: stats.completedBookings, color: "bg-emerald-500" },
                { label: "In Progress", value: stats.activeBookings, color: "bg-orange-500" },
                { label: "Pending", value: stats.pendingBookings, color: "bg-amber-500" },
                { label: "Cancelled", value: stats.cancelledBookings, color: "bg-red-500" },
              ].map((row) => {
                const pct = stats.totalBookings > 0 ? (row.value / stats.totalBookings) * 100 : 0;
                return (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-20 shrink-0">{row.label}</span>
                    <div className="flex-1 bg-slate-800 rounded-full h-2">
                      <div
                        className={cn("h-2 rounded-full transition-all", row.color)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-white w-6 text-right">{row.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recent bookings */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700">
            <h2 className="text-sm font-semibold text-slate-300">Recent Bookings</h2>
          </div>
          {bookingsLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 bg-slate-800 rounded" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs border-b border-slate-800">
                    <th className="text-left px-5 py-3 font-medium">ID</th>
                    <th className="text-left px-5 py-3 font-medium">Customer</th>
                    <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Route</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-right px-5 py-3 font-medium">Amount</th>
                    <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 text-slate-400 font-mono">#{b.id}</td>
                      <td className="px-5 py-3 text-white font-medium">{b.customerName ?? "—"}</td>
                      <td className="px-5 py-3 text-slate-400 hidden md:table-cell max-w-xs">
                        <span className="truncate block">{b.pickupAddress.split(",")[0]} → {b.dropoffAddress.split(",")[0]}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", STATUS_COLORS[b.status])}>
                          {STATUS_LABELS[b.status] ?? b.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-white font-semibold">
                        {formatCurrency(b.finalPrice ?? b.estimatedPrice)}
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs hidden lg:table-cell">{formatDate(b.createdAt)}</td>
                    </tr>
                  ))}
                  {recentBookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-500">No bookings yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
