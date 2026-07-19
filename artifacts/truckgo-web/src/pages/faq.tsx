import { useState } from "react";
import { ChevronDown, Search, HelpCircle, Truck, CreditCard, MapPin, Shield, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

interface FaqItem {
  q: string;
  a: string;
  category: string;
}

const CATEGORIES = [
  { id: "all",      label: "All",         icon: HelpCircle },
  { id: "booking",  label: "Booking",     icon: Truck },
  { id: "pricing",  label: "Pricing",     icon: CreditCard },
  { id: "tracking", label: "Tracking",    icon: MapPin },
  { id: "drivers",  label: "Drivers",     icon: Users },
  { id: "safety",   label: "Safety",      icon: Shield },
  { id: "timing",   label: "Timing",      icon: Clock },
];

const FAQS: FaqItem[] = [
  // Booking
  {
    category: "booking",
    q: "How do I book a truck?",
    a: "Enter your pickup and dropoff addresses on the home page, select the truck type that fits your cargo, and tap Get Price Estimate. Once you're happy with the quote, add a description of what you're moving and confirm. A nearby driver will be notified instantly.",
  },
  {
    category: "booking",
    q: "Can I schedule a booking in advance?",
    a: "Same-day dispatch is our default and most popular option. Scheduled bookings (up to 7 days in advance) are available for all account types — just select your preferred date and time during checkout.",
  },
  {
    category: "booking",
    q: "How do I cancel a booking?",
    a: "Open My Bookings, tap the booking you want to cancel, and hit Cancel. Cancellations are free up to 30 minutes before the scheduled pickup. After that a small fee (10% of the booking total) applies to cover the driver's time.",
  },
  {
    category: "booking",
    q: "What happens if no driver is available?",
    a: "If no driver accepts within 10 minutes, we automatically expand the search radius and notify you. If still no driver is found within 20 minutes, the booking is released and you're not charged. You can try again or contact our dispatch team for priority matching.",
  },
  {
    category: "booking",
    q: "Can I change my address after booking?",
    a: "Minor address changes (same suburb, within 2 km) can be made before a driver accepts. Significant changes require cancelling and rebooking as they affect pricing. Contact support if you're unsure.",
  },
  // Pricing
  {
    category: "pricing",
    q: "How is the price calculated?",
    a: "Your price = base rate (per truck type) + per-km rate × distance. There are no surge charges, fuel levies, or hidden fees. The estimate you see before booking is the final price you pay — guaranteed.",
  },
  {
    category: "pricing",
    q: "When am I charged?",
    a: "Your card is authorised at booking but only charged after the delivery is marked as completed by the driver. You'll receive an email receipt immediately after the charge.",
  },
  {
    category: "pricing",
    q: "Do you offer business accounts or bulk discounts?",
    a: "Yes. Business accounts with monthly invoicing and volume discounts are available for companies making 10+ bookings per month. Reach out via the Contact page and our team will set you up.",
  },
  {
    category: "pricing",
    q: "What payment methods do you accept?",
    a: "All major credit and debit cards (Visa, Mastercard, Amex). Business accounts can also pay by bank transfer or monthly invoice. We do not accept cash.",
  },
  // Tracking
  {
    category: "tracking",
    q: "How does live tracking work?",
    a: "Once a driver accepts and starts your job, a live map appears on your booking detail page. The driver's position updates every 8 seconds using their phone's GPS — no extra app needed on your end. The map works in any modern browser.",
  },
  {
    category: "tracking",
    q: "Will I be notified when my driver is close?",
    a: "Yes. You'll receive a push notification (if enabled) when your driver is 10 minutes away, when they arrive, and when the delivery is completed.",
  },
  {
    category: "tracking",
    q: "Can I share the tracking link with someone else?",
    a: "Shareable tracking links are coming soon. For now, anyone with your TruckGo account credentials can view the booking detail and live map.",
  },
  // Drivers
  {
    category: "drivers",
    q: "How do I sign up as a driver?",
    a: "Tap Get started on the home page and choose Register as a Driver. You'll need a valid driver's licence, vehicle registration, and proof of comprehensive insurance. Our team reviews applications within 1–2 business days.",
  },
  {
    category: "drivers",
    q: "What vehicle types can I register?",
    a: "We accept Utes, Small Vans, Large Vans, Curtainsiders (rigid), and Semi Trailers. Your vehicle must be roadworthy, under 15 years old, and pass our inspection criteria.",
  },
  {
    category: "drivers",
    q: "How are drivers paid?",
    a: "Earnings are deposited to your nominated bank account every Monday for the previous week's completed jobs. You can view a full earnings breakdown in the Driver app under Dashboard.",
  },
  {
    category: "drivers",
    q: "Can I set my own availability hours?",
    a: "Absolutely. The driver app has an availability toggle — flip it to Online when you're ready to accept jobs and Offline when you're not. You're in full control of your schedule.",
  },
  // Safety
  {
    category: "safety",
    q: "Are drivers background-checked?",
    a: "Every driver undergoes a national police check, identity verification, and a driving history review before approval. Checks are renewed annually.",
  },
  {
    category: "safety",
    q: "What if my goods are damaged in transit?",
    a: "All deliveries are covered by cargo insurance up to $50,000. If damage occurs, contact us within 48 hours with photos of the damage and packaging. We'll open a claim with our insurer on your behalf — most claims are resolved within 5 business days.",
  },
  {
    category: "safety",
    q: "How do I report an issue with a driver?",
    a: "Use the Report button on your completed booking detail page, or email safety@truckgo.com. All reports are reviewed within 4 hours and drivers are suspended pending investigation for serious complaints.",
  },
  // Timing
  {
    category: "timing",
    q: "How quickly can a driver arrive?",
    a: "In metro areas, most pickups happen within 30–60 minutes of booking. Same-day dispatch is available 7 days a week. Estimated arrival time is shown on your booking confirmation.",
  },
  {
    category: "timing",
    q: "Do you operate 24/7?",
    a: "Driver dispatch operates 24/7. Our support team is available 7 am – 10 pm AEST Monday–Sunday, with an emergency line for in-transit issues any time.",
  },
  {
    category: "timing",
    q: "How long does a delivery take?",
    a: "Estimated delivery time is shown on every quote. Same-city deliveries typically take 1–3 hours. Factors like traffic, loading/unloading time, and distance all affect the ETA.",
  },
];

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("border rounded-xl overflow-hidden transition-all", open ? "border-primary/30 bg-primary/4" : "border-white/8 bg-white/3 hover:border-white/15")}>
      <button
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
        onClick={() => setOpen(v => !v)}
      >
        <span className={cn("text-sm font-semibold leading-snug", open ? "text-white" : "text-white/80")}>{item.q}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform text-white/40", open && "rotate-180 text-primary")} />
      </button>
      {open && (
        <div className="px-5 pb-5">
          <div className="h-px bg-white/8 mb-4" />
          <p className="text-sm text-white/55 leading-relaxed">{item.a}</p>
        </div>
      )}
    </div>
  );
}

export default function Faq() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = FAQS.filter(f => {
    const matchesCat = activeCategory === "all" || f.category === activeCategory;
    const matchesQuery = !query || f.q.toLowerCase().includes(query.toLowerCase()) || f.a.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/8" style={{ background: "linear-gradient(160deg,#0d0e1d,#07080f 60%,#0d0a07)" }}>
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle,#F48525,transparent 65%)", filter: "blur(60px)" }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6 text-xs font-bold uppercase tracking-widest"
            style={{ background: "rgba(244,133,37,0.1)", borderColor: "rgba(244,133,37,0.25)", color: "#F48525" }}>
            <HelpCircle className="h-3 w-3" />
            Help Centre
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-3">Frequently Asked Questions</h1>
          <p className="text-white/45 text-sm mb-8">Everything you need to know about TruckGo</p>

          {/* Search */}
          <div className="relative max-w-lg mx-auto">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-white/30" />
            <Input
              placeholder="Search questions…"
              className="pl-11 h-12 bg-white/6 border-white/12 text-white placeholder:text-white/30 focus:border-primary rounded-xl"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                activeCategory === cat.id
                  ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                  : "bg-white/4 text-white/55 border-white/10 hover:border-white/20 hover:text-white"
              )}
            >
              <cat.icon className="h-3 w-3" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <p className="text-xs text-white/30 mb-5 font-medium">
          {filtered.length} question{filtered.length !== 1 ? "s" : ""}
          {activeCategory !== "all" ? ` in ${CATEGORIES.find(c => c.id === activeCategory)?.label}` : ""}
          {query ? ` matching "${query}"` : ""}
        </p>

        {/* Accordion list */}
        {filtered.length > 0 ? (
          <div className="space-y-2.5">
            {filtered.map((item, i) => <FaqAccordion key={i} item={item} />)}
          </div>
        ) : (
          <div className="text-center py-16 glass-card rounded-xl">
            <HelpCircle className="h-8 w-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm">No questions match your search.</p>
            <button onClick={() => { setQuery(""); setActiveCategory("all"); }} className="mt-3 text-primary text-sm hover:underline">Clear filters</button>
          </div>
        )}

        {/* Still need help? */}
        <div className="mt-14 rounded-2xl p-8 text-center border border-primary/20 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,rgba(244,133,37,0.1),rgba(244,133,37,0.03))" }}>
          <div className="pointer-events-none absolute inset-0 opacity-20"
            style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(244,133,37,0.4),transparent 70%)" }} />
          <h3 className="relative text-base font-bold text-white mb-1">Still have questions?</h3>
          <p className="relative text-white/45 text-sm mb-6">Our support team is available 7 am – 10 pm AEST, 7 days a week.</p>
          <div className="relative flex items-center justify-center gap-3 flex-wrap">
            <Link href="/contact"
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-lg shadow-primary/25 btn-glow transition-all">
              Contact support
            </Link>
            <button
              onClick={() => document.getElementById("chat-widget-trigger")?.click()}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-white/12 px-5 text-sm font-semibold text-white hover:bg-white/6 transition-all"
            >
              Chat with us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
