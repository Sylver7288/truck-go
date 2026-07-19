import { useState, useRef } from "react";
import { useLocation, Link } from "wouter";
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
import {
  MapPin, Package, Clock, Truck, ArrowRight, Loader2, CheckCircle2,
  Zap, Shield, Star, ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const TRUST_STATS = [
  { value: "4,200+", label: "Deliveries completed" },
  { value: "98%", label: "On-time rate" },
  { value: "24/7", label: "Dispatch support" },
];

const HOW_IT_WORKS = [
  { icon: MapPin, title: "Enter your route", desc: "Pickup and drop-off addresses" },
  { icon: Truck, title: "Choose a truck", desc: "Size matched to your cargo" },
  { icon: Zap, title: "Get a live quote", desc: "Instant price estimate" },
  { icon: CheckCircle2, title: "Driver dispatched", desc: "Verified & insured driver" },
];

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
      toast({ title: "Incomplete details", description: "Please enter pickup, dropoff, and select a truck type.", variant: "destructive" });
      return;
    }
    estimateRef.current({
      data: { truckTypeId: selectedTruckId, pickupAddress: pickup, dropoffAddress: dropoff, distanceKm: estimatedDistance },
    });
  };

  const handleBook = () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please log in to confirm a booking." });
      setLocation("/login");
      return;
    }
    if (user.role !== "customer") {
      toast({ title: "Not available", description: "Only customers can book trucks.", variant: "destructive" });
      return;
    }
    if (!estimateMutation.data || !goodsDescription) {
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
          notes: notes || undefined,
        },
      },
      {
        onSuccess: (booking) => {
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey({ customerId: user.userId }) });
          toast({ title: "Booking confirmed", description: "A driver has been notified." });
          setLocation(`/bookings/${booking.id}`);
        },
        onError: () => {
          toast({ title: "Booking failed", description: "Something went wrong. Please try again.", variant: "destructive" });
        },
      }
    );
  };

  const selectedTruck = truckTypes?.find(t => t.id === selectedTruckId);

  return (
    <>
      {/* ── Hero ── */}
      <section className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/25 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
              <Zap className="h-3 w-3" />
              Same-day dispatch available
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-[1.1] tracking-tight mb-5">
              Enterprise freight,
              <br />
              <span className="text-primary">delivered on time.</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-xl">
              TruckGo connects your business with vetted, insured drivers for reliable same-day freight delivery — transparent pricing, real-time tracking.
            </p>
            <div className="flex flex-wrap gap-10">
              {TRUST_STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-extrabold text-white">{s.value}</div>
                  <div className="text-sm text-slate-400 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Booking section ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left column ─ form */}
          <div className="lg:col-span-7 space-y-8">

            {/* Route card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Route Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">Where are we picking up and delivering?</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Pickup Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-primary" />
                    <Input
                      placeholder="e.g. 123 Main St, Sydney"
                      className="pl-10 h-11 border-slate-200 bg-white focus:border-primary"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-100" />
                  <div className="h-6 w-6 rounded-full border border-slate-200 bg-white flex items-center justify-center">
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                  </div>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Dropoff Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="e.g. 456 Park Ave, Melbourne"
                      className="pl-10 h-11 border-slate-200 bg-white focus:border-primary"
                      value={dropoff}
                      onChange={(e) => setDropoff(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Truck type selection */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Select Vehicle Type</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Choose the size that fits your cargo</p>
                </div>
                {selectedTruckId && availableDrivers !== undefined && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {availableDrivers.length} driver{availableDrivers.length !== 1 ? "s" : ""} nearby
                  </div>
                )}
              </div>

              {isLoadingTrucks ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {truckTypes?.map(truck => {
                    const selected = selectedTruckId === truck.id;
                    return (
                      <button
                        key={truck.id}
                        type="button"
                        onClick={() => {
                          setSelectedTruckId(truck.id);
                          estimateMutation.reset();
                        }}
                        className={cn(
                          "text-left p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30",
                          selected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              "h-9 w-9 rounded-lg flex items-center justify-center",
                              selected ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                            )}>
                              <Truck className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 text-sm">{truck.name}</p>
                              <p className="text-xs text-slate-400">Up to {truck.capacityKg.toLocaleString()} kg</p>
                            </div>
                          </div>
                          {selected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-2.5">{truck.description}</p>
                        <div className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-2 py-1 inline-block">
                          {formatCurrency(truck.basePrice)} base · {formatCurrency(truck.pricePerKm)}/km
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right column ─ summary / CTA */}
          <div className="lg:col-span-5 lg:sticky lg:top-20">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
              {/* Accent strip */}
              <div className="h-1 bg-gradient-to-r from-primary to-amber-400 w-full" />

              <div className="px-6 py-5 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">Booking Summary</h2>
                {pickup && dropoff ? (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-slate-700 font-medium truncate">{pickup}</span>
                    </div>
                    <div className="ml-2 w-px h-3 bg-slate-200" />
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <span className="text-slate-600 truncate">{dropoff}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 mt-1">Enter your route to get started</p>
                )}
              </div>

              <div className="p-6 space-y-5">
                {!estimateMutation.data ? (
                  <>
                    {selectedTruck && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Truck className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{selectedTruck.name}</p>
                          <p className="text-xs text-slate-400">Selected vehicle</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 text-xs text-slate-500">
                      {[
                        "Real-time pricing, no hidden fees",
                        "Insured & background-checked drivers",
                        "Cancel free up to 30 min before pickup",
                      ].map((t) => (
                        <div key={t} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          {t}
                        </div>
                      ))}
                    </div>

                    <Button
                      className="w-full h-11 font-semibold shadow-sm"
                      onClick={handleGetEstimate}
                      disabled={!pickup || !dropoff || !selectedTruckId || estimateMutation.isPending}
                    >
                      {estimateMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Calculating…</>
                      ) : (
                        <>Get Price Estimate <ChevronRight className="h-4 w-4 ml-1" /></>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3">
                    {/* Price display */}
                    <div className="rounded-xl bg-slate-900 text-white p-5">
                      <div className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Estimated Total</div>
                      <div className="text-4xl font-extrabold tracking-tight">{formatCurrency(estimateMutation.data.estimatedTotal)}</div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700 text-xs text-slate-400">
                        <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{estimateMutation.data.distanceKm} km</div>
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" />~{estimateMutation.data.estimatedMinutes} mins</div>
                      </div>
                    </div>

                    {/* Goods */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">What are we moving?</Label>
                      <div className="relative">
                        <Package className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="e.g. Office equipment, 10 cartons"
                          className="pl-10 h-11 border-slate-200"
                          value={goodsDescription}
                          onChange={(e) => setGoodsDescription(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Delivery Notes <span className="font-normal text-slate-400 normal-case">(optional)</span></Label>
                      <Textarea
                        placeholder="Gate code, loading dock instructions, fragile items…"
                        className="border-slate-200 resize-none text-sm"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    <Button
                      className="w-full h-11 font-bold shadow-sm"
                      onClick={handleBook}
                      disabled={createBookingMutation.isPending || !goodsDescription}
                    >
                      {createBookingMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Confirming…</>
                      ) : "Confirm Booking"}
                    </Button>
                    <button
                      onClick={() => estimateMutation.reset()}
                      className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
                    >
                      ← Edit route
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">How TruckGo works</h2>
            <p className="text-slate-500 mt-2 text-sm">From quote to delivery in four steps</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="relative text-center">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-5 left-[60%] w-[80%] h-px bg-slate-200 z-0" />
                )}
                <div className="relative z-10 mx-auto mb-4 h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Step {i + 1}</div>
                <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, title: "Fully insured", desc: "Every delivery is covered by comprehensive cargo insurance up to $50,000." },
              { icon: Star, title: "Verified drivers", desc: "All drivers pass background checks, vehicle inspections, and training." },
              { icon: Zap, title: "Real-time updates", desc: "Track your delivery from dispatch to doorstep, every step of the way." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">{f.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!user && (
        <section className="bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Ready to streamline your logistics?</h2>
            <p className="text-slate-400 text-sm mb-8">Join hundreds of businesses already using TruckGo for daily freight.</p>
            <div className="flex items-center justify-center gap-3">
              <Button asChild size="lg" className="font-semibold">
                <Link href="/register">Create free account</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-semibold bg-transparent text-white border-slate-700 hover:bg-slate-800">
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
