import { useAuth } from "@/hooks/use-auth";
import { useListBookings, useGetBookingSummary, getListBookingsQueryKey, getGetBookingSummaryQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { formatCurrency, formatDate, getStatusBadgeVariant } from "@/lib/format";
import { MapPin, Package, ArrowRight, Truck, DollarSign, Clock, CheckCircle2, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BookingsList() {
  const { user } = useAuth();
  const customerId = user?.userId || 0;

  const { data: bookings, isLoading } = useListBookings(
    { customerId },
    { query: { enabled: !!customerId, queryKey: getListBookingsQueryKey({ customerId }) } }
  );

  const { data: summary } = useGetBookingSummary(
    { customerId },
    { query: { enabled: !!customerId, queryKey: getGetBookingSummaryQueryKey({ customerId }) } }
  );

  if (!user || user.role !== "customer") return null;

  const summaryItems = summary ? [
    { icon: Activity,      label: "Active",    value: summary.active,                        color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100" },
    { icon: Clock,         label: "Pending",   value: summary.pending,                       color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-100" },
    { icon: CheckCircle2,  label: "Completed", value: summary.completed,                     color: "text-emerald-600",bg: "bg-emerald-50",border: "border-emerald-100" },
    { icon: DollarSign,    label: "Total Spent",value: formatCurrency(summary.totalSpent),   color: "text-primary",    bg: "bg-primary/5", border: "border-primary/20" },
  ] : [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Bookings</h1>
          <p className="text-slate-500 text-sm mt-1">View and manage your freight requests</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {summaryItems.map((item) => (
              <div key={item.label} className={cn("rounded-xl border p-4 bg-white flex items-center gap-3", item.border)}>
                <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", item.bg)}>
                  <item.icon className={cn("h-4 w-4", item.color)} />
                </div>
                <div>
                  <div className={cn("text-xl font-extrabold leading-tight", item.color)}>{item.value}</div>
                  <div className="text-xs text-slate-500 font-medium">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Booking list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : bookings?.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
            <div className="h-14 w-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Truck className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">No bookings yet</h3>
            <p className="text-slate-500 text-sm mt-1 mb-6">Get started by booking your first truck.</p>
            <Link href="/" className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors">
              Book a Truck
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings?.map((booking) => (
              <Link key={booking.id} href={`/bookings/${booking.id}`}>
                <div className="bg-white rounded-xl border border-slate-200 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
                  <div className="p-5">
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <Badge variant={getStatusBadgeVariant(booking.status)} className="capitalize font-semibold">
                          {booking.status.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-slate-400">{formatDate(booking.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-lg text-slate-900">
                          {formatCurrency(booking.finalPrice || booking.estimatedPrice)}
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                    </div>

                    {/* Route */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        <span className="text-sm font-medium text-slate-700 truncate">{booking.pickupAddress}</span>
                      </div>
                      <div className="h-px w-6 bg-slate-200 shrink-0" />
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-sm text-slate-500 truncate text-right">{booking.dropoffAddress}</span>
                        <div className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium">{booking.truckTypeName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate max-w-[200px]">{booking.goodsDescription}</span>
                      </div>
                      {booking.driverName && (
                        <div className="ml-auto text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {booking.driverName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
