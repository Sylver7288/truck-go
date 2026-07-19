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
  Zap, Shield, Star, ChevronRight, Navigation2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const TRUST_STATS = [
  { value: "4,200+", label: "Deliveries completed" },
  { value: "98%",    label: "On-time rate" },
  { value: "24/7",   label: "Dispatch support" },
];

const HOW_IT_WORKS = [
  { icon: MapPin,        title: "Enter your route",    desc: "Pickup and drop-off addresses" },
  { icon: Truck,         title: "Choose a truck",      desc: "Size matched to your cargo" },
  { icon: Zap,           title: "Get a live quote",    desc: "Instant price estimate" },
  { icon: CheckCircle2,  title: "Driver dispatched",   desc: "Verified & insured driver" },
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
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #0d0e1d 0%, #07080f 60%, #0d0a07 100%)" }}>
        {/* Amber glow blob */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #F48525 0%, transparent 65%)", filter: "blur(60px)" }} />
        <div className="pointer-events-none absolute top-20 right-0 h-[400px] w-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 65%)", filter: "blur(60px)" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-7 text-xs font-semibold uppercase tracking-widest"
              style={{ background: "rgba(244,133,37,0.1)", borderColor: "rgba(244,133,37,0.25)", color: "#F48525" }}>
              <Zap className="h-3 w-3" />
              Same-day dispatch available
            </div>

            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-5">
              <span className="text-white">Enterprise freight,</span>
              <br />
              <span className="gradient-text-amber">delivered on time.</span>
            </h1>
            <p className="text-white/55 text-lg leading-relaxed mb-10 max-w-xl">
              TruckGo connects your business with vetted, insured drivers for reliable same-day freight delivery — transparent pricing, real-time tracking.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-10">
              {TRUST_STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-extrabold text-white">{s.value}</div>
                  <div className="text-sm text-white/45 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Booking section ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left column — form */}
          <div className="lg:col-span-7 space-y-6">

            {/* Route card */}
            <div className="glass-card overflow-hidden">
              <div className="px-6 py-4 border-b border-white/8">
                <h2 className="text-xs font-bold text-white uppercase tracking-widest">Route Details</h2>
                <p className="text-xs text-white/40 mt-0.5">Where are we picking up and delivering?</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Pickup Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-green-400" />
                    <Input
                      placeholder="e.g. 123 Main St, Sydney"
                      className="pl-10 h-11 bg-white/4 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus:bg-white/6 transition-colors"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/8" />
                  <div className="h-6 w-6 rounded-full border border-white/12 bg-white/4 flex items-center justify-center">
                    <ArrowRight className="h-3 w-3 text-white/30" />
                  </div>
                  <div className="flex-1 h-px bg-white/8" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-white/50 uppercase tracking-widest">Dropoff Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-red-400" />
                    <Input
                      placeholder="e.g. 456 Park Ave, Melbourne"
                      className="pl-10 h-11 bg-white/4 border-white/10 text-white placeholder:text-white/25 focus:border-primary focus:bg-white/6 transition-colors"
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
                  <h2 className="text-xs font-bold text-white uppercase tracking-widest">Select Vehicle Type</h2>
                  <p className="text-xs text-white/40 mt-0.5">Choose the size that fits your cargo</p>
                </div>
                {selectedTruckId && availableDrivers !== undefined && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    {availableDrivers.length} driver{availableDrivers.length !== 1 ? "s" : ""} nearby
                  </div>
                )}
              </div>

              {isLoadingTrucks ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-28 rounded-xl bg-white/4 animate-pulse" />
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
                        onClick={() => { setSelectedTruckId(truck.id); estimateMutation.reset(); }}
                        className={cn(
                          "text-left p-4 rounded-xl border-2 transition-all focus:outline-none",
                          selected
                            ? "border-primary bg-primary/8 shadow-lg shadow-primary/10"
                            : "border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5"
                        )}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
                              selected ? "bg-primary text-white shadow-md shadow-primary/30" : "bg-white/8 text-white/50"
                            )}>
                              <Truck className="h-4 w-4" />
                            </div>
                            <div>
                              <p className={cn("font-semibold text-sm", selected ? "text-white" : "text-white/80")}>{truck.name}</p>
                              <p className="text-xs text-white/35">Up to {truck.capacityKg.toLocaleString()} kg</p>
                            </div>
                          </div>
                          {selected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-white/40 leading-relaxed mb-2.5">{truck.description}</p>
                        <div className={cn(
                          "text-xs font-semibold rounded-md px-2 py-1 inline-block border transition-colors",
                          selected
                            ? "bg-primary/15 border-primary/30 text-primary"
                            : "bg-white/4 border-white/8 text-white/50"
                        )}>
                          {formatCurrency(truck.basePrice)} base · {formatCurrency(truck.pricePerKm)}/km
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column — summary / CTA */}
          <div className="lg:col-span-5 lg:sticky lg:top-20">
            <div className="glass-card overflow-hidden">
              {/* Amber accent strip */}
              <div className="h-0.5 bg-gradient-to-r from-primary via-amber-400 to-transparent w-full" />

              <div className="px-6 py-5 border-b border-white/8">
                <h2 className="font-bold text-white">Booking Summary</h2>
                {pickup && dropoff ? (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                      <span className="text-white/80 font-medium truncate">{pickup}</span>
                    </div>
                    <div className="ml-2 w-px h-3 bg-white/15" />
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                      <span className="text-white/60 truncate">{dropoff}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-white/30 mt-1">Enter your route to get started</p>
                )}
              </div>

              <div className="p-6 space-y-5">
                {!estimateMutation.data ? (
                  <>
                    {selectedTruck && (
                      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/4 border border-white/8">
                        <div className="h-8 w-8 bg-primary/15 rounded-lg flex items-center justify-center">
                          <Truck className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{selectedTruck.name}</p>
                          <p className="text-xs text-white/40">Selected vehicle</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 text-xs text-white/40">
                      {[
                        "Real-time pricing, no hidden fees",
                        "Insured & background-checked drivers",
                        "Cancel free up to 30 min before pickup",
                      ].map((t) => (
                        <div key={t} className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                          {t}
                        </div>
                      ))}
                    </div>

                    <Button
                      className="w-full h-11 font-semibold btn-glow shadow-lg shadow-primary/25 transition-all"
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
                    <div className="rounded-xl p-5 border border-primary/20" style={{ background: "linear-gradient(135deg, rgba(244,133,37,0.15) 0%, rgba(244,133,37,0.05) 100%)" }}>
                      <div className="text-xs text-primary/60 mb-1 font-bold uppercase tracking-widest">Estimated Total</div>
                      <div className="text-4xl font-extrabold tracking-tight text-white">{formatCurrency(estimateMutation.data.estimatedTotal)}</div>
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10 text-xs text-white/40">
                        <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-primary/70" />{estimateMutation.data.distanceKm} km</div>
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-primary/70" />~{estimateMutation.data.estimatedMinutes} mins</div>
                      </div>
                    </div>

                    {/* Goods */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-white/50 uppercase tracking-widest">What are we moving?</Label>
                      <div className="relative">
                        <Package className="absolute left-3.5 top-3 h-4 w-4 text-white/30" />
                        <Input
                          placeholder="e.g. Office equipment, 10 cartons"
                          className="pl-10 h-11 bg-white/4 border-white/10 text-white placeholder:text-white/25 focus:border-primary"
                          value={goodsDescription}
                          onChange={(e) => setGoodsDescription(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-white/50 uppercase tracking-widest">
                        Delivery Notes <span className="font-normal text-white/25 normal-case">(optional)</span>
                      </Label>
                      <Textarea
                        placeholder="Gate code, loading dock instructions, fragile items…"
                        className="bg-white/4 border-white/10 text-white placeholder:text-white/25 resize-none text-sm focus:border-primary"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    <Button
                      className="w-full h-11 font-bold btn-glow shadow-lg shadow-primary/25 transition-all"
                      onClick={handleBook}
                      disabled={createBookingMutation.isPending || !goodsDescription}
                    >
                      {createBookingMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Confirming…</>
                      ) : "Confirm Booking"}
                    </Button>
                    <button
                      onClick={() => estimateMutation.reset()}
                      className="w-full text-center text-sm text-white/30 hover:text-white/60 transition-colors py-1"
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
      <section className="border-t border-white/6" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-3">Simple process</p>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">How TruckGo works</h2>
            <p className="text-white/40 mt-2 text-sm">From quote to delivery in four steps</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="relative text-center group">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-[62%] w-[76%] h-px z-0" style={{ background: "linear-gradient(90deg, rgba(244,133,37,0.3), transparent)" }} />
                )}
                <div className="relative z-10 mx-auto mb-4 h-12 w-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 border border-primary/20"
                  style={{ background: "linear-gradient(135deg, rgba(244,133,37,0.15), rgba(244,133,37,0.05))" }}>
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-[10px] font-bold text-primary/50 uppercase tracking-widest mb-1">Step {i + 1}</div>
                <p className="text-sm font-semibold text-white">{step.title}</p>
                <p className="text-xs text-white/35 mt-1">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="border-t border-white/6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield,     title: "Fully insured",     desc: "Every delivery is covered by comprehensive cargo insurance up to $50,000." },
              { icon: Star,       title: "Verified drivers",  desc: "All drivers pass background checks, vehicle inspections, and training." },
              { icon: Navigation2, title: "Real-time tracking", desc: "Track your delivery live on the map from dispatch to doorstep." },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 group">
                <div className="h-10 w-10 rounded-xl border border-primary/20 flex items-center justify-center shrink-0 transition-all group-hover:border-primary/40"
                  style={{ background: "rgba(244,133,37,0.08)" }}>
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{f.title}</h3>
                  <p className="text-xs text-white/40 mt-1 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      {!user && (
        <section className="border-t border-white/6 relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-30"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(244,133,37,0.2) 0%, transparent 70%)" }} />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Ready to streamline your logistics?</h2>
            <p className="text-white/40 text-sm mb-10">Join hundreds of businesses already using TruckGo for daily freight.</p>
            <div className="flex items-center justify-center gap-3">
              <Button asChild size="lg" className="font-semibold btn-glow shadow-xl shadow-primary/30">
                <Link href="/register">Create free account</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-semibold border-white/12 text-white hover:bg-white/6 bg-transparent">
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
