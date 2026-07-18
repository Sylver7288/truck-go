import { useParams, useLocation } from "wouter";
import { 
  useGetBooking, 
  useCancelBooking, 
  useCreateReview,
  useGetTruckType,
  getGetBookingQueryKey,
  getGetTruckTypeQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Package, Truck, Clock, Phone, AlertCircle, Star } from "lucide-react";
import { formatCurrency, formatDate, getStatusBadgeVariant } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState } from "react";

export default function BookingDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: booking, isLoading } = useGetBooking(
    id,
    { query: { enabled: !!id, queryKey: getGetBookingQueryKey(id) } }
  );

  const { data: truckType } = useGetTruckType(
    booking?.truckTypeId || 0,
    { query: { enabled: !!booking?.truckTypeId, queryKey: getGetTruckTypeQueryKey(booking?.truckTypeId || 0) } }
  );

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
          toast({ title: "Booking cancelled", description: "Your booking has been cancelled successfully." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to cancel booking.", variant: "destructive" });
        }
      }
    );
  };

  const handleSubmitReview = () => {
    if (!booking || !booking.driverId) return;

    reviewRef.current(
      { 
        data: { 
          bookingId: booking.id, 
          customerId: booking.customerId, 
          driverId: booking.driverId, 
          rating, 
          comment: comment || undefined 
        } 
      },
      {
        onSuccess: () => {
          toast({ title: "Review submitted", description: "Thank you for your feedback!" });
          // Optional: invalidate something to show review was submitted
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to submit review.", variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) {
    return <div className="max-w-4xl mx-auto py-12 px-4 animate-pulse"><div className="h-64 bg-slate-100 rounded-xl mb-8"></div></div>;
  }

  if (!booking) {
    return <div className="max-w-4xl mx-auto py-12 px-4 text-center">Booking not found.</div>;
  }

  const isPending = booking.status === "pending";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-secondary">Booking #{booking.id}</h1>
            <Badge variant={getStatusBadgeVariant(booking.status)} className="capitalize">
              {booking.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Requested on {formatDate(booking.createdAt)}</p>
        </div>
        
        {isPending && (
          <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending}>
            {cancelMutation.isPending ? "Cancelling..." : "Cancel Booking"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5" /> Route Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-8 space-y-8">
                <div className="absolute left-2.5 top-2 bottom-2 w-px bg-border"></div>
                
                <div className="relative">
                  <div className="absolute -left-[29px] top-1 h-4 w-4 rounded-full bg-primary ring-4 ring-card"></div>
                  <div>
                    <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Pickup</div>
                    <div className="font-medium text-secondary">{booking.pickupAddress}</div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-[29px] top-1 h-4 w-4 rounded-full bg-secondary ring-4 ring-card"></div>
                  <div>
                    <div className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">Dropoff</div>
                    <div className="font-medium text-secondary">{booking.dropoffAddress}</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-4 border-t flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1"><Truck className="h-4 w-4" /> {booking.distanceKm} km</div>
                {booking.startedAt && <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> Started: {formatDate(booking.startedAt)}</div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" /> Cargo Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Goods Description</div>
                <div className="font-medium">{booking.goodsDescription}</div>
              </div>
              {booking.notes && (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Notes</div>
                  <div className="p-3 bg-slate-50 rounded-md text-sm border">{booking.notes}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {booking.status === "completed" && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" /> Leave a Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-2 transition-colors ${star <= rating ? 'text-primary' : 'text-slate-300'}`}
                    >
                      <Star className="h-8 w-8 fill-current" />
                    </button>
                  ))}
                </div>
                <Textarea 
                  placeholder="How was the driver?" 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <Button 
                  onClick={handleSubmitReview}
                  disabled={reviewMutation.isPending}
                >
                  {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-50/50">
            <CardHeader>
              <CardTitle className="text-lg">Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-sm text-muted-foreground">
                  {booking.status === 'completed' ? 'Final Price' : 'Estimated Price'}
                </div>
                <div className="text-3xl font-bold text-secondary">
                  {formatCurrency(booking.finalPrice || booking.estimatedPrice)}
                </div>
              </div>
              {booking.status !== 'completed' && (
                <div className="mt-3 text-xs text-muted-foreground flex items-start gap-2 bg-white p-2 rounded border">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                  Final price may vary slightly based on wait times or route changes.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Driver & Vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              {booking.driverId ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {booking.driverName?.charAt(0) || 'D'}
                    </div>
                    <div>
                      <div className="font-medium text-secondary">{booking.driverName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {booking.driverPhone}
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="text-sm text-muted-foreground mb-1">Truck Type</div>
                    <div className="font-medium flex items-center gap-2">
                      <Truck className="h-4 w-4" /> {booking.truckTypeName}
                    </div>
                    {truckType && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Capacity: {truckType.capacityKg}kg
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-slate-200 mb-2"></div>
                    <p>Finding a driver...</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
