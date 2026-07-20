import { useState } from "react";
import { useListAdminDrivers } from "@workspace/api-client-react";
import { AdminLayout } from "./layout";
import { formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Search, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type StatusFilter = "all" | "available" | "busy" | "offline";

const STATUS_COLORS: Record<string, string> = {
  available: "text-emerald-400 bg-emerald-950/50 border-emerald-800",
  busy: "text-amber-400 bg-amber-950/50 border-amber-800",
  offline: "text-slate-400 bg-slate-800 border-slate-600",
};

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  busy: "On a job",
  offline: "Offline",
};

const FILTERS: StatusFilter[] = ["all", "available", "busy", "offline"];

export default function AdminDrivers() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: drivers, isLoading } = useListAdminDrivers();

  const driverRows = Array.isArray(drivers) ? drivers : [];

  const filtered = driverRows.filter((d) => {
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.vehiclePlate.toLowerCase().includes(q) ||
      (d.truckTypeName ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const updateDriverStatus = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/admin/drivers/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(await response.text());
      await queryClient.invalidateQueries();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-white">Drivers</h1>
          <p className="text-slate-400 text-sm mt-0.5">{filtered.length} records</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, plate, truck type..."
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-9 pr-4 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors capitalize",
                  statusFilter === f
                    ? "bg-primary border-primary text-white"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500"
                )}
              >
                {f === "all" ? "All" : STATUS_LABELS[f]}
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
                  <th className="text-left px-5 py-3 font-medium">Driver</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Phone</th>
                  <th className="text-left px-5 py-3 font-medium">Truck</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Plate</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Rating</th>
                  <th className="text-right px-5 py-3 font-medium">Trips</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Joined</th>
                  <th className="text-left px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-800/50">
                        <td colSpan={9} className="px-5 py-3">
                          <Skeleton className="h-5 bg-slate-800 rounded" />
                        </td>
                      </tr>
                    ))
                  : filtered.map((d) => (
                      <tr key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                              {d.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-white font-medium">{d.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-400 hidden md:table-cell">{d.phone}</td>
                        <td className="px-5 py-3 text-slate-300 text-xs">{d.truckTypeName ?? "—"}</td>
                        <td className="px-5 py-3 text-slate-400 font-mono text-xs hidden sm:table-cell">{d.vehiclePlate}</td>
                        <td className="px-5 py-3">
                          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", STATUS_COLORS[d.status])}>
                            {STATUS_LABELS[d.status] ?? d.status}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            <span className="text-white font-semibold">{d.rating.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right text-slate-300 font-semibold">{d.totalTrips}</td>
                        <td className="px-5 py-3 text-slate-500 text-xs hidden lg:table-cell">{d.createdAt ? formatDate(d.createdAt) : "—"}</td>
                        <td className="px-5 py-3">
                          <select
                            value={d.status}
                            disabled={updatingId === d.id}
                            onChange={(event) => updateDriverStatus(d.id, event.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                          >
                            {FILTERS.filter((status) => status !== "all").map((status) => (
                              <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-16 text-center text-slate-500">
                      No drivers match your filter.
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
