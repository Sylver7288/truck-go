import { useState } from "react";
import { useListAdminBookings } from "@workspace/api-client-react";
import { AdminLayout } from "./layout";
import { formatCurrency, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Search, SlidersHorizontal } from "lucide-react";

type StatusFilter = "all" | "pending" | "accepted" | "in_progress" | "completed" | "cancelled";

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-400 bg-amber-950/50 border-amber-800",
  accepted: "text-blue-400 bg-blue-950/50 border-blue-800",
  in_progress: "text-orange-400 bg-orange-950/50 border-orange-800",
  completed: "text-emerald-400 bg-emerald-950/50 border-emerald-800",
  cancelled: "text-red-400 bg-red-950/50 border-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  all: "All",
  pending: "Pending",
  accepted: "Accepted",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const FILTERS: StatusFilter[] = ["all", "pending", "accepted", "in_progress", "completed", "cancelled"];

export default function AdminBookings() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const { data: bookings, isLoading } = useListAdminBookings();

  const filtered = (bookings ?? []).filter((b) => {
    const matchStatus = statusFilter === "all" || b.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || 
      String(b.id).includes(q) ||
      (b.customerName ?? "").toLowerCase().includes(q) ||
      (b.driverName ?? "").toLowerCase().includes(q) ||
      b.pickupAddress.toLowerCase().includes(q) ||
      b.dropoffAddress.toLowerCase().includes(q) ||
      b.goodsDescription.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Bookings</h1>
            <p className="text-slate-400 text-sm mt-0.5">{filtered.length} records</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, driver, address..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-9 pr-4 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition-colors",
                  statusFilter === f
                    ? "bg-primary border-primary text-white"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
                )}
              >
                {STATUS_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs border-b border-slate-800">
                  <th className="text-left px-5 py-3 font-medium">ID</th>
                  <th className="text-left px-5 py-3 font-medium">Customer</th>
                  <th className="text-left px-5 py-3 font-medium">Driver</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Pickup</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Dropoff</th>
                  <th className="text-left px-5 py-3 font-medium">Truck</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 font-medium hidden xl:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-800/50">
                        <td colSpan={9} className="px-5 py-3">
                          <Skeleton className="h-5 bg-slate-800 rounded" />
                        </td>
                      </tr>
                    ))
                  : filtered.map((b) => (
                      <tr key={b.id} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3 text-slate-400 font-mono text-xs">#{b.id}</td>
                        <td className="px-5 py-3 text-white font-medium">{b.customerName ?? "—"}</td>
                        <td className="px-5 py-3 text-slate-300">{b.driverName ?? <span className="text-slate-600 italic">Unassigned</span>}</td>
                        <td className="px-5 py-3 text-slate-400 hidden lg:table-cell max-w-[200px]">
                          <span className="truncate block">{b.pickupAddress.split(",")[0]}</span>
                        </td>
                        <td className="px-5 py-3 text-slate-400 hidden lg:table-cell max-w-[200px]">
                          <span className="truncate block">{b.dropoffAddress.split(",")[0]}</span>
                        </td>
                        <td className="px-5 py-3 text-slate-400 text-xs">{b.truckTypeName ?? "—"}</td>
                        <td className="px-5 py-3">
                          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", STATUS_COLORS[b.status])}>
                            {STATUS_LABELS[b.status] ?? b.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-white font-semibold">
                          {formatCurrency(b.finalPrice ?? b.estimatedPrice)}
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs hidden xl:table-cell">{formatDate(b.createdAt)}</td>
                      </tr>
                    ))}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center text-slate-500">
                      No bookings match your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
