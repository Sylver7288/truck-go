import { useState } from "react";
import { useListAdminCustomers } from "@workspace/api-client-react";
import { AdminLayout } from "./layout";
import { formatCurrency, formatDate } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const { data: customers, isLoading } = useListAdminCustomers();

  const filtered = (customers ?? []).filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-slate-400 text-sm mt-0.5">{filtered.length} records</p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-9 pr-4 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-primary"
          />
        </div>

        {/* Table */}
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs border-b border-slate-800">
                  <th className="text-left px-5 py-3 font-medium">Customer</th>
                  <th className="text-left px-5 py-3 font-medium hidden md:table-cell">Email</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">Phone</th>
                  <th className="text-right px-5 py-3 font-medium">Bookings</th>
                  <th className="text-right px-5 py-3 font-medium">Total Spent</th>
                  <th className="text-left px-5 py-3 font-medium hidden lg:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-800/50">
                        <td colSpan={6} className="px-5 py-3">
                          <Skeleton className="h-5 bg-slate-800 rounded" />
                        </td>
                      </tr>
                    ))
                  : filtered.map((c) => (
                      <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                              {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-white font-medium">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-400 hidden md:table-cell">{c.email}</td>
                        <td className="px-5 py-3 text-slate-400 hidden sm:table-cell">{c.phone}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={cn(
                            "text-xs font-semibold px-2 py-0.5 rounded-full border",
                            c.totalBookings > 0
                              ? "text-blue-400 bg-blue-950/50 border-blue-800"
                              : "text-slate-500 bg-slate-800 border-slate-700"
                          )}>
                            {c.totalBookings}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-white font-semibold">
                          {c.totalSpent > 0 ? formatCurrency(c.totalSpent) : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-5 py-3 text-slate-500 text-xs hidden lg:table-cell">{formatDate(c.createdAt)}</td>
                      </tr>
                    ))}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-slate-500">
                      No customers match your search.
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
