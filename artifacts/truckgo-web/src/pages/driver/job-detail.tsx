import { useParams } from "wouter";
import { 
  useGetBooking, 
  useAcceptBooking, 
  useStartBooking, 
  useCompleteBooking,
  getGetBookingQueryKey 
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Package, Phone, Navigation, CheckCircle2, Clock } from "lucide-react";
import { formatCurrency, formatDate, getStatusBadgeVariant } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";

export default function JobDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: job, isLoading } = useGetBooking(
    id,
    { query: { enabled: !!id, queryKey: getGetBookingQueryKey(id) } }
  );

  const acceptMutation = useAcceptBooking();
  const acceptRef = useRef(acceptMutation.mutate);
  acceptRef.current = acceptMutation.mutate;

  const startMutation = useStartBooking();
  const startRef = useRef(startMutation.mutate);
  startRef.current = startMutation.mutate;

  const completeMutation = useCompleteBooking();
  const completeRef = useRef(completeMutation.mutate);
  completeRef.current = completeMutation.mutate;

  const handleAction = (action: 'accept' | 'start' | 'complete') => {
    if (!user?.userId) return;

    const onSuccess = () => {
      queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(id) });
      toast({ title: "Status Updated", description: `Job marked as ${action}ed.` });
    };
    const onError = () => toast({ title: "Error", description: "Failed to update status.", variant: "destructive" });

    if (action === 'accept') {
      acceptRef.current({ id, data: { driverId: user.userId } }, { onSuccess, onError });
    } else if (action === 'start') {
      startRef.current({ id }, { onSuccess, onError });
    } else if (action === 'complete') {
      completeRef.current({ id }, { onSuccess, onError });
    }
  };

  if (isLoading) return <div className="max-w-4xl mx-auto py-12 px-4 animate-pulse"><div className="h-64 bg-slate-100 rounded-xl"></div></div>;
  if (!job) return <div className="max-w-4xl mx-auto py-12 px-4 text-center">Job not found.</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-secondary">Job #{job.id}</h1>
            <Badge variant={getStatusBadgeVariant(job.status)} className="capitalize text-sm px-3 py-1">
              {job.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" /> Posted {formatDate(job.createdAt)}
          </p>
        </div>
        
        <div className="flex items-center gap-3 font-bold text-2xl text-primary">
          {formatCurrency(job.finalPrice || job.estimatedPrice)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-md">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg">Navigation</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative pl-8 space-y-10">
                <div className="absolute left-[15px] top-4 bottom-4 w-1 bg-slate-100 rounded-full"></div>
                
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-4 ring-card">
                    <div className="h-3 w-3 bg-emerald-600 rounded-full"></div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Pickup Location</div>
                    <div className="font-semibold text-lg text-secondary">{job.pickupAddress}</div>
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(job.pickupAddress)}`} target="_blank" rel="noreferrer" className="inline-flex mt-2 text-sm text-primary font-medium hover:underline items-center gap-1">
                      <Navigation className="h-3 w-3" /> Get Directions
                    </a>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute -left-[31px] top-1 h-8 w-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center ring-4 ring-card">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-destructive uppercase tracking-wider mb-1">Dropoff Location</div>
                    <div className="font-semibold text-lg text-secondary">{job.dropoffAddress}</div>
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(job.dropoffAddress)}`} target="_blank" rel="noreferrer" className="inline-flex mt-2 text-sm text-primary font-medium hover:underline items-center gap-1">
                      <Navigation className="h-3 w-3" /> Get Directions
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-muted-foreground" /> Cargo Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-lg">{job.goodsDescription}</p>
              {job.notes && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                  <span className="font-bold text-amber-800 text-sm block mb-1">Customer Notes:</span>
                  <span className="text-amber-900">{job.notes}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-semibold text-secondary">{job.customerName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Phone</div>
                <Button variant="outline" className="w-full justify-start text-primary border-primary/20 bg-primary/5 hover:bg-primary/10">
                  <Phone className="h-4 w-4 mr-2" /> Call Customer
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary border-2">
            <CardHeader className="bg-secondary text-secondary-foreground">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 bg-slate-50">
              {job.status === "pending" && (
                <Button 
                  className="w-full h-14 text-lg" 
                  onClick={() => handleAction('accept')}
                  disabled={acceptMutation.isPending}
                >
                  Accept Job
                </Button>
              )}
              {job.status === "accepted" && (
                <Button 
                  className="w-full h-14 text-lg" 
                  onClick={() => handleAction('start')}
                  disabled={startMutation.isPending}
                >
                  <Navigation className="mr-2 h-5 w-5" /> Start Trip
                </Button>
              )}
              {job.status === "in_progress" && (
                <Button 
                  className="w-full h-14 text-lg bg-emerald-500 hover:bg-emerald-600 text-white" 
                  onClick={() => handleAction('complete')}
                  disabled={completeMutation.isPending}
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" /> Complete Delivery
                </Button>
              )}
              {job.status === "completed" && (
                <div className="text-center text-emerald-600 font-bold flex items-center justify-center gap-2 p-4">
                  <CheckCircle2 className="h-6 w-6" /> Job Completed
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
