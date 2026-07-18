import { useAuth } from "@/hooks/use-auth";
import { 
  useGetDriver, 
  useUpdateDriverStatus, 
  useGetDriverStats, 
  useListDriverReviews,
  getGetDriverQueryKey, 
  getGetDriverStatsQueryKey,
  getListDriverReviewsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DollarSign, Star, Truck, CheckCircle2, TrendingUp, Navigation } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";

export default function DriverDashboard() {
  const { user } = useAuth();
  const driverId = user?.userId || 0;
  const queryClient = useQueryClient();

  const { data: driver, isLoading: isLoadingDriver } = useGetDriver(
    driverId,
    { query: { enabled: !!driverId, queryKey: getGetDriverQueryKey(driverId) } }
  );

  const { data: stats, isLoading: isLoadingStats } = useGetDriverStats(
    driverId,
    { query: { enabled: !!driverId, queryKey: getGetDriverStatsQueryKey(driverId) } }
  );

  const { data: reviews } = useListDriverReviews(
    driverId,
    { query: { enabled: !!driverId, queryKey: getListDriverReviewsQueryKey(driverId) } }
  );

  const updateStatusMutation = useUpdateDriverStatus();
  const updateStatusRef = useRef(updateStatusMutation.mutate);
  updateStatusRef.current = updateStatusMutation.mutate;

  const handleStatusToggle = (checked: boolean) => {
    const newStatus = checked ? "available" : "offline";
    updateStatusRef.current(
      { id: driverId, data: { status: newStatus as any } },
      {
        onSuccess: (data) => {
          queryClient.setQueryData(getGetDriverQueryKey(driverId), data);
        }
      }
    );
  };

  if (!user || user.role !== "driver") return null;

  if (isLoadingDriver || isLoadingStats) {
    return <div className="max-w-6xl mx-auto py-8 px-4 animate-pulse space-y-8"><div className="h-32 bg-slate-100 rounded-xl"></div><div className="h-64 bg-slate-100 rounded-xl"></div></div>;
  }

  const isAvailable = driver?.status === "available";

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-secondary">Driver Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {driver?.name}</p>
        </div>
        
        <Card className={`border-2 transition-colors ${isAvailable ? 'border-emerald-500 bg-emerald-50/50' : 'border-border'}`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="flex flex-col">
              <Label htmlFor="status-toggle" className="font-semibold text-base mb-1">
                {isAvailable ? "You're Online" : "You're Offline"}
              </Label>
              <span className="text-xs text-muted-foreground">
                {isAvailable ? "Receiving job requests" : "Go online to receive jobs"}
              </span>
            </div>
            <Switch 
              id="status-toggle" 
              checked={isAvailable}
              onCheckedChange={handleStatusToggle}
              disabled={driver?.status === "busy" || updateStatusMutation.isPending}
            />
          </CardContent>
        </Card>
      </div>

      {driver?.status === "busy" && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary text-white rounded-full"><Navigation className="h-5 w-5" /></div>
            <div>
              <h3 className="font-semibold text-secondary">Active Delivery in Progress</h3>
              <p className="text-sm text-muted-foreground">You are currently on a job. Status cannot be changed until completed.</p>
            </div>
          </div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                <h3 className="text-2xl font-bold text-secondary">{formatCurrency(stats.totalEarnings)}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Jobs</p>
                <h3 className="text-2xl font-bold text-secondary">{stats.completedTrips}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                <Star className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rating</p>
                <div className="flex items-baseline gap-1">
                  <h3 className="text-2xl font-bold text-secondary">{stats.rating.toFixed(1)}</h3>
                  <span className="text-sm text-muted-foreground">({stats.reviewCount})</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Trips</p>
                <h3 className="text-2xl font-bold text-secondary">{stats.totalTrips}</h3>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 bg-slate-100 rounded-xl flex items-center justify-center">
                <Truck className="h-8 w-8 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-secondary">{driver?.truckTypeName}</h3>
                <p className="text-muted-foreground">{driver?.vehicleYear} • Plate: {driver?.vehiclePlate}</p>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              License: {driver?.licenseNumber}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews && reviews.length > 0 ? (
              reviews.slice(0, 3).map(review => (
                <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-sm">{review.customerName}</div>
                    <div className="flex gap-1 text-amber-500">
                      {[...Array(review.rating)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-muted-foreground">"{review.comment}"</p>}
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(review.createdAt)}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No reviews yet. Complete more trips to get rated!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
