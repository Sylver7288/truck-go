import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  useListTruckTypes, 
  useGetPriceEstimate, 
  useCreateBooking, 
  useListAvailableDrivers,
  getListBookingsQueryKey,
  getListAvailableDriversQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Package, Clock, Truck, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [selectedTruckId, setSelectedTruckId] = useState<number | null>(null);
  const [goodsDescription, setGoodsDescription] = useState("");
  const [notes, setNotes] = useState("");
  
  // Use 15km as default for estimate if real maps API is not available
  const estimatedDistance = 15.5; 

  const { data: truckTypes, isLoading: isLoadingTrucks } = useListTruckTypes();
  const { data: availableDrivers } = useListAvailableDrivers(
    { truckTypeId: selectedTruckId || undefined },
    { query: { enabled: !!selectedTruckId, queryKey: getListAvailableDriversQueryKey({ truckTypeId: selectedTruckId || undefined }) } }
  );

  const estimateMutation = useGetPriceEstimate();
  const createBookingMutation = useCreateBooking();

  const estimateRef = useRef(estimateMutation.mutate);
  estimateRef.current = estimateMutation.mutate;
  
  const createRef = useRef(createBookingMutation.mutate);
  createRef.current = createBookingMutation.mutate;

  const handleGetEstimate = () => {
    if (!pickup || !dropoff || !selectedTruckId) {
      toast({ title: "Incomplete details", description: "Please enter pickup, dropoff, and select a truck.", variant: "destructive" });
      return;
    }
    
    estimateRef.current({
      data: {
        truckTypeId: selectedTruckId,
        pickupAddress: pickup,
        dropoffAddress: dropoff,
        distanceKm: estimatedDistance
      }
    });
  };

  const handleBook = () => {
    if (!user) {
      toast({ title: "Authentication required", description: "Please log in to book a truck." });
      setLocation("/login");
      return;
    }

    if (user.role !== "customer") {
      toast({ title: "Not a customer", description: "Only customers can book trucks.", variant: "destructive" });
      return;
    }

    if (!estimateMutation.data) return;
    if (!goodsDescription) {
      toast({ title: "Required", description: "Please describe what you are transporting.", variant: "destructive" });
      return;
    }

    createRef.current(
      {
        data: {
          customerId: user.userId,
          truckTypeId: selectedTruckId!,
          pickupAddress: pickup,
          dropoffAddress: dropoff,
          distanceKm: estimatedDistance,
          estimatedPrice: estimateMutation.data.estimatedTotal,
          goodsDescription,
          notes: notes || undefined
        }
      },
      {
        onSuccess: (booking) => {
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey({ customerId: user.userId }) });
          toast({ title: "Booking confirmed", description: "Your truck is on the way!" });
          setLocation(`/bookings/${booking.id}`);
        },
        onError: () => {
          toast({ title: "Booking failed", description: "Something went wrong. Please try again.", variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-7 space-y-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-secondary mb-4">
              Move anything, <span className="text-primary">anywhere.</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Book a truck on demand for your business or personal needs. Reliable logistics at your fingertips.
            </p>
          </div>

          <Card className="border-border/60 shadow-lg">
            <CardHeader>
              <CardTitle>Route Details</CardTitle>
              <CardDescription>Where are we picking up and delivering?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <div className="absolute left-3 top-3 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <Input 
                  placeholder="Pickup Address" 
                  className="pl-10 h-12"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                />
              </div>
              <div className="relative">
                <div className="absolute left-3 top-3 text-muted-foreground">
                  <MapPin className="h-5 w-5 text-secondary" />
                </div>
                <Input 
                  placeholder="Dropoff Address" 
                  className="pl-10 h-12"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Select Truck Type</h3>
              {selectedTruckId && availableDrivers && (
                <div className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  {availableDrivers.length} {availableDrivers.length === 1 ? "driver" : "drivers"} available nearby
                </div>
              )}
            </div>
            
            {isLoadingTrucks ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {truckTypes?.map(truck => (
                  <div 
                    key={truck.id}
                    onClick={() => {
                      setSelectedTruckId(truck.id);
                      estimateMutation.reset();
                    }}
                    className={cn(
                      "relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-primary/50",
                      selectedTruckId === truck.id ? "border-primary bg-primary/5" : "border-border bg-card"
                    )}
                  >
                    {selectedTruckId === truck.id && (
                      <div className="absolute top-3 right-3 text-primary">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-secondary/10 rounded-lg">
                        <Truck className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-secondary">{truck.name}</h4>
                        <p className="text-xs text-muted-foreground">Up to {truck.capacityKg}kg</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{truck.description}</p>
                    <div className="mt-3 font-medium text-sm text-secondary">
                      Base: {formatCurrency(truck.basePrice)} • {formatCurrency(truck.pricePerKm)}/km
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>

        <div className="lg:col-span-5 sticky top-24">
          <Card className="border-border/60 shadow-xl overflow-hidden">
            <div className="h-2 bg-primary w-full"></div>
            <CardHeader className="bg-slate-50/50 border-b pb-6">
              <CardTitle>Booking Summary</CardTitle>
              {pickup && dropoff ? (
                <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex-1 truncate font-medium">{pickup}</div>
                  <ArrowRight className="h-4 w-4 mx-2 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 truncate font-medium text-right">{dropoff}</div>
                </div>
              ) : (
                <CardDescription className="mt-2">Enter route to continue</CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="pt-6 space-y-6">
              {!estimateMutation.data ? (
                <div className="space-y-4">
                  <Button 
                    className="w-full h-12 text-lg font-medium" 
                    onClick={handleGetEstimate}
                    disabled={!pickup || !dropoff || !selectedTruckId || estimateMutation.isPending}
                  >
                    {estimateMutation.isPending ? "Calculating..." : "Get Price Estimate"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-border">
                    <div className="flex justify-between items-end mb-4">
                      <div className="text-sm text-muted-foreground">Estimated Cost</div>
                      <div className="text-3xl font-bold text-secondary">{formatCurrency(estimateMutation.data.estimatedTotal)}</div>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground border-t pt-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {estimateMutation.data.distanceKm} km
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> ~{estimateMutation.data.estimatedMinutes} mins
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="goods">What are we moving?</Label>
                      <div className="relative">
                        <Package className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input 
                          id="goods"
                          placeholder="e.g. 5 boxes of office supplies, a sofa" 
                          className="pl-10"
                          value={goodsDescription}
                          onChange={(e) => setGoodsDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                      <Textarea 
                        id="notes"
                        placeholder="Gate code, loading dock instructions..." 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 text-lg font-bold" 
                    onClick={handleBook}
                    disabled={createBookingMutation.isPending || !goodsDescription}
                  >
                    {createBookingMutation.isPending ? "Confirming..." : "Confirm Booking"}
                  </Button>
                  <Button variant="ghost" className="w-full" onClick={() => estimateMutation.reset()}>
                    Edit Route
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
