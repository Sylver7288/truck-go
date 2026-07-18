import { useAuth } from "@/hooks/use-auth";
import { useListBookings, useGetBookingSummary, getListBookingsQueryKey, getGetBookingSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { formatCurrency, formatDate, getStatusBadgeVariant } from "@/lib/format";
import { MapPin, Package, ArrowRight, Truck } from "lucide-react";

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

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-secondary">My Bookings</h1>
        <p className="text-muted-foreground mt-2">View and manage your transport requests.</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-secondary">{summary.active}</div>
              <div className="text-sm font-medium text-muted-foreground">Active Deliveries</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-secondary">{summary.pending}</div>
              <div className="text-sm font-medium text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-secondary">{summary.completed}</div>
              <div className="text-sm font-medium text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-primary">{formatCurrency(summary.totalSpent)}</div>
              <div className="text-sm font-medium text-muted-foreground">Total Spent</div>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-32 animate-pulse bg-slate-50" />
          ))}
        </div>
      ) : bookings?.length === 0 ? (
        <div className="text-center py-16 bg-card border rounded-xl shadow-sm">
          <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-secondary">No bookings yet</h3>
          <p className="text-muted-foreground mt-1 mb-6">You haven't requested any trucks yet.</p>
          <Link href="/" className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
            Book a Truck
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings?.map((booking) => (
            <Link key={booking.id} href={`/bookings/${booking.id}`}>
              <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer group">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(booking.status)} className="capitalize">
                            {booking.status.replace("_", " ")}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{formatDate(booking.createdAt)}</span>
                        </div>
                        <div className="font-bold text-lg text-secondary">
                          {formatCurrency(booking.finalPrice || booking.estimatedPrice)}
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-3 relative">
                          <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-primary mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-secondary truncate">{booking.pickupAddress}</p>
                              <p className="text-muted-foreground text-xs">Pickup</p>
                            </div>
                          </div>
                          <div className="absolute left-2.5 top-6 bottom-6 w-px bg-border -z-10"></div>
                          <div className="flex items-start gap-3">
                            <MapPin className="h-5 w-5 text-secondary mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-secondary truncate">{booking.dropoffAddress}</p>
                              <p className="text-muted-foreground text-xs">Dropoff</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3 bg-slate-50 p-3 rounded-lg border">
                          <div className="flex items-center gap-2 text-sm">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{booking.truckTypeName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{booking.goodsDescription}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center justify-center p-6 border-l bg-slate-50/50 group-hover:bg-primary/5 transition-colors">
                      <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
