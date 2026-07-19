import { useParams, useLocation } from "wouter";
import {
  useGetBooking,
  useCancelBooking,
  useCreateReview,
  useGetTruckType,
  getGetBookingQueryKey,
  getGetTruckTypeQueryKey,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin, Package, Truck, Clock, Phone, AlertCircle, Star,
  Navigation2, ArrowLeft, CheckCircle2, XCircle,
} from "lucide-react";
import { formatCurrency, formatDate, getStatusBadgeVariant } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState, lazy, Suspense } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

// Lazy-load the map so leaflet CSS doesn't block the rest of the page
const LiveTrackingMap = lazy(() =>
  import("@/components/LiveTrackingMap").then((m) => ({ default: m.LiveTrackingMap }))
);

const STATUS_CONFIG = {
  pending:     { label: "Pending",     color: "text-amber-400",   bg: "bg-amber-500/10",  border: "border-amber-500/20",  icon: Clock },
  accepted:    { label: "Accepted",    color: "text-blue-400",    bg: "bg-blue-500/10",   border: "border-blue-500/20",   icon: CheckCircle2 },
  in_progress: { label: "In Progress", color: "text-green-400",   bg: "bg-green-500/10",  border: "border-green-500/20",  icon: Navigation2 },
  completed:   { label: "Completed",   color: "text-emerald-400", bg: "bg-emerald-500/10",border: "border-emerald-500/20",icon: CheckCircle2 },
  cancelled:   { label: "Cancelled",   color: "text-red-400",     bg: "bg-red-500/10",    border: "border-red-500/20",    icon: XCircle },
};

export default function BookingDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: booking, isLoading } = useGetBooking(id, {
    query: { enabled: !!id, queryKey: getGetBookingQueryKey(id) },
  });

  const { data: truckType } = useGetTruckType(booking?.truckTypeId || 0, {
    query: {
      enabled: !!booking?.truckTypeId,
      queryKey: getGetTruckTypeQueryKey(booking?.truckTypeId || 0),
    },
  });

  const cancelMutation = useCancelBooking();
  const cancelRef = useRef(cancelMutation.mutate);
  cancelRef.current = cancelMutation.mutate;

  const reviewMutation = useCreateReview();
  const reviewRef = useRef(reviewMutation.mutate);
  reviewRef.current = reviewMutation.mutate;

  const handleCancel = () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    cancelRef.current(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(id) });
          toast({ title: "Booking cancelled", description: "Your booking has been cancelled." });
        },
        onError: () => toast({ title: "Error", description: "Failed to cancel booking.", variant: "destructive" }),
      }
    );
  };

  const handleSubmitReview = () => {
    if (!booking?.driverId) return;
    reviewRef.current(
      { data: { bookingId: booking.id, customerId: booking.customerId, driverId: booking.driverId, rating, comment: comment || undefined } },
      {
        onSuccess: () => toast({ title: "Review submitted", description: "Thank you for your feedback!" }),
        onError: () => toast({ title: "Error", description: "Failed to submit review.", variant: "destructive" }),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm">Loading booking…</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Booking not found.</p>
          <Link href="/bookings">
            <Button variant="outline">Back to bookings</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[booking.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const showMap = booking.status === "in_progress" || booking.status === "accepted";

  return (
    <div className="min-h-screen pb-16">
      {/* Page header */}
      <div className="border-b border-white/8 py-6 px-4 sm:px-6" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => navigate("/bookings")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-white transition-colors mb-4 group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            My Bookings
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Booking <span className="gradient-text-amber">#{booking.id}</span>
              </h1>
              <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border", statusCfg.color, statusCfg.bg, statusCfg.border)}>
                <StatusIcon className="h-3.5 w-3.5" />
                {statusCfg.label}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Requested {formatDate(booking.createdAt)}</span>
              {booking.status === "pending" && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleCancel}
                  disabled={cancelMutation.isPending}
                  className="font-semibold"
                >
                  {cancelMutation.isPending ? "Cancelling…" : "Cancel Booking"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Live tracking map — visible when accepted or in_progress */}
        {showMap && (
          <div className="glass-card overflow-hidden">
            <div className="px-5 pt-5 pb-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-green-500/15 flex items-center justify-center">
                <Navigation2 className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Live Driver Location</h2>
                <p className="text-xs text-muted-foreground">Updates every 8 seconds</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-medium">Active</span>
              </div>
            </div>
            <div style={{ height: "340px" }}>
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              }>
                <LiveTrackingMap
                  bookingId={id}
                  pickupAddress={booking.pickupAddress}
                  dropoffAddress={booking.dropoffAddress}
                />
              </Suspense>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">

            {/* Route */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <h2 className="text-sm font-semibold text-white">Route Details</h2>
              </div>

              <div className="relative pl-7">
                {/* Connector line */}
                <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gradient-to-b from-green-500 to-red-500 opacity-40" />

                <div className="mb-6 relative">
                  <div className="absolute -left-7 top-1 h-3.5 w-3.5 rounded-full bg-green-500 ring-4 ring-green-500/20" />
                  <div className="text-[10px] font-bold text-green-400 uppercase tracking-widest mb-1">Pickup</div>
                  <div className="font-medium text-white text-sm leading-snug">{booking.pickupAddress}</div>
                </div>

                <div className="relative">
                  <div className="absolute -left-7 top-1 h-3.5 w-3.5 rounded-full bg-red-500 ring-4 ring-red-500/20" />
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Dropoff</div>
                  <div className="font-medium text-white text-sm leading-snug">{booking.dropoffAddress}</div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/8 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Truck className="h-3.5 w-3.5 text-primary/70" />
                  <span className="font-medium text-white/70">{booking.distanceKm} km</span>
                </div>
                {booking.scheduledAt && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-400/70" />
                    <span>Scheduled: {formatDate(booking.scheduledAt)}</span>
                  </div>
                )}
                {booking.startedAt && (
                  <div className="flex items-center gap-1.5">
                    <Navigation2 className="h-3.5 w-3.5 text-green-400/70" />
                    <span>Started: {formatDate(booking.startedAt)}</span>
                  </div>
                )}
                {booking.completedAt && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400/70" />
                    <span>Completed: {formatDate(booking.completedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cargo */}
            <div className="glass-card p-5">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-8 w-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                  <Package className="h-4 w-4 text-blue-400" />
                </div>
                <h2 className="text-sm font-semibold text-white">Cargo Details</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Goods Description</div>
                  <div className="text-sm text-white font-medium">{booking.goodsDescription}</div>
                </div>
                {booking.notes && (
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Notes</div>
                    <div className="text-sm text-white/70 bg-white/4 rounded-xl p-3 border border-white/8 leading-relaxed">{booking.notes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Review — only for completed bookings */}
            {booking.status === "completed" && (
              <div className="glass-card p-5 border-primary/20">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-sm font-semibold text-white">Leave a Review</h2>
                </div>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          "h-7 w-7 transition-colors",
                          star <= rating ? "text-primary fill-primary" : "text-white/20"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  placeholder="How was the driver?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="bg-white/4 border-white/10 text-white placeholder:text-white/30 mb-3 resize-none"
                  rows={3}
                />
                <Button
                  onClick={handleSubmitReview}
                  disabled={reviewMutation.isPending}
                  className="font-semibold btn-glow"
                >
                  {reviewMutation.isPending ? "Submitting…" : "Submit Review"}
                </Button>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">

            {/* Payment */}
            <div className="glass-card p-5">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Payment</h2>
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-4 border border-primary/20 mb-3">
                <div className="text-xs text-primary/70 font-medium mb-1">
                  {booking.status === "completed" ? "Final Price" : "Estimated Price"}
                </div>
                <div className="text-3xl font-extrabold text-white">
                  {formatCurrency(booking.finalPrice || booking.estimatedPrice)}
                </div>
              </div>
              {booking.status !== "completed" && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground bg-white/4 p-3 rounded-xl border border-white/8">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
                  Final price may vary slightly based on wait times or route changes.
                </div>
              )}
            </div>

            {/* Driver & Vehicle */}
            <div className="glass-card p-5">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Driver & Vehicle</h2>
              {booking.driverId ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-sm font-bold flex items-center justify-center ring-2 ring-primary/20 shrink-0">
                      {booking.driverName?.charAt(0) ?? "D"}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{booking.driverName}</div>
                      {booking.driverPhone && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {booking.driverPhone}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/8 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Truck Type</span>
                      <span className="font-semibold text-white flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-primary" />
                        {booking.truckTypeName}
                      </span>
                    </div>
                    {truckType && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Capacity</span>
                        <span className="font-semibold text-white">{truckType.capacityKg.toLocaleString()} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center gap-3 text-center">
                  <div className="h-12 w-12 rounded-full bg-white/6 flex items-center justify-center">
                    <Truck className="h-6 w-6 text-muted-foreground animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Finding a driver…</p>
                    <p className="text-xs text-muted-foreground mt-0.5">We'll assign one shortly</p>
                  </div>
                </div>
              )}
            </div>

            {/* Status timeline */}
            <div className="glass-card p-5">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Status Timeline</h2>
              <div className="space-y-3">
                {(["pending", "accepted", "in_progress", "completed"] as const).map((s, i) => {
                  const cfg = STATUS_CONFIG[s];
                  const Icon = cfg.icon;
                  const reached = ["pending", "accepted", "in_progress", "completed"].indexOf(booking.status) >= i;
                  const isCurrent = booking.status === s;
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <div className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-all",
                        isCurrent ? cn(cfg.bg, "ring-2", cfg.border) : reached ? "bg-white/10" : "bg-white/4"
                      )}>
                        <Icon className={cn("h-3.5 w-3.5", isCurrent ? cfg.color : reached ? "text-white/50" : "text-white/20")} />
                      </div>
                      <span className={cn("text-xs font-medium", isCurrent ? "text-white" : reached ? "text-white/50" : "text-white/25")}>
                        {cfg.label}
                      </span>
                      {isCurrent && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
