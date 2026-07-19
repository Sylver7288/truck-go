import { useState } from "react";
import { Mail, Phone, Clock, MapPin, Send, CheckCircle2, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const SUBJECTS = [
  { value: "general",         label: "General Inquiry" },
  { value: "booking_issue",   label: "Booking Issue" },
  { value: "driver_support",  label: "Driver Support" },
  { value: "billing",         label: "Billing & Payments" },
  { value: "damage_claim",    label: "Damage Claim" },
  { value: "partnership",     label: "Business Partnership" },
  { value: "other",           label: "Other" },
];

const CONTACT_INFO = [
  { icon: Phone,   title: "Phone",         detail: "1800 TRUCKGO",              sub: "Mon–Sun, 7 am – 10 pm AEST" },
  { icon: Mail,    title: "Email",         detail: "support@truckgo.com",       sub: "We reply within 24 hours" },
  { icon: MapPin,  title: "Head Office",   detail: "Level 12, 333 George St",   sub: "Sydney NSW 2000, Australia" },
  { icon: Clock,   title: "Dispatch line", detail: "Available 24/7",            sub: "For urgent in-transit issues" },
];

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast({ title: "All fields are required", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${base}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setSent(true);
    } catch (err: unknown) {
      toast({ title: "Failed to send", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/8"
        style={{ background: "linear-gradient(160deg,#0d0e1d,#07080f 60%,#0d0a07)" }}>
        <div className="pointer-events-none absolute -top-32 right-0 h-[400px] w-[500px] rounded-full opacity-12"
          style={{ background: "radial-gradient(circle,#F48525,transparent 65%)", filter: "blur(70px)" }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6 text-xs font-bold uppercase tracking-widest"
            style={{ background: "rgba(244,133,37,0.1)", borderColor: "rgba(244,133,37,0.25)", color: "#F48525" }}>
            <Mail className="h-3 w-3" />
            Get in touch
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Contact us</h1>
          <p className="text-white/45 text-sm max-w-lg">
            Have a question, issue, or just want to say hello? We're here to help — fill out the form and we'll get back to you within 24 hours.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Left — contact info */}
          <div className="lg:col-span-4 space-y-4">
            {CONTACT_INFO.map(({ icon: Icon, title, detail, sub }) => (
              <div key={title} className="flex gap-4 glass-card rounded-xl p-4 border border-white/8 group hover:border-primary/25 transition-all">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border border-primary/20 transition-colors group-hover:border-primary/40"
                  style={{ background: "rgba(244,133,37,0.08)" }}>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{title}</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{detail}</p>
                  <p className="text-xs text-white/35 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}

            {/* Chat CTA */}
            <div className="glass-card rounded-xl p-5 border border-primary/20 mt-6 text-center"
              style={{ background: "linear-gradient(135deg,rgba(244,133,37,0.1),rgba(244,133,37,0.03))" }}>
              <MessageSquare className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">Need a quick answer?</p>
              <p className="text-xs text-white/40 mt-1 mb-4">Our chat assistant is available around the clock.</p>
              <button
                onClick={() => document.getElementById("chat-widget-trigger")?.click()}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-primary/30 px-4 text-sm font-semibold text-primary hover:bg-primary/10 transition-all w-full"
              >
                Open live chat
              </button>
            </div>
          </div>

          {/* Right — form */}
          <div className="lg:col-span-8">
            {sent ? (
              <div className="glass-card rounded-2xl border border-emerald-500/20 p-12 text-center flex flex-col items-center"
                style={{ background: "linear-gradient(135deg,rgba(16,185,129,0.08),rgba(16,185,129,0.02))" }}>
                <div className="h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mb-5">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-extrabold text-white mb-2">Message sent!</h2>
                <p className="text-white/50 text-sm max-w-sm">
                  Thanks for reaching out, {form.name.split(" ")[0]}. We've received your message and will get back to you at <span className="text-white/70">{form.email}</span> within 24 hours.
                </p>
                <button
                  onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="mt-8 text-sm text-white/40 hover:text-white transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass-card rounded-2xl border border-white/8 overflow-hidden">
                <div className="h-0.5 bg-gradient-to-r from-primary via-amber-400 to-transparent" />
                <div className="p-8 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-white/45 uppercase tracking-widest">Full Name</Label>
                      <Input
                        placeholder="Alex Smith"
                        className="h-11 bg-white/4 border-white/10 text-white placeholder:text-white/25 focus:border-primary"
                        value={form.name}
                        onChange={field("name")}
                        required
                      />
                    </div>
                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-white/45 uppercase tracking-widest">Email Address</Label>
                      <Input
                        type="email"
                        placeholder="you@company.com"
                        className="h-11 bg-white/4 border-white/10 text-white placeholder:text-white/25 focus:border-primary"
                        value={form.email}
                        onChange={field("email")}
                        required
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-white/45 uppercase tracking-widest">Subject</Label>
                    <select
                      className={cn(
                        "w-full h-11 rounded-lg border px-3 text-sm transition-colors bg-white/4 border-white/10 focus:border-primary focus:outline-none",
                        form.subject ? "text-white" : "text-white/25"
                      )}
                      style={{ background: "rgba(255,255,255,0.04)" }}
                      value={form.subject}
                      onChange={field("subject")}
                      required
                    >
                      <option value="" disabled>Select a topic…</option>
                      {SUBJECTS.map(s => (
                        <option key={s.value} value={s.value} className="bg-[#0f1018] text-white">{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-white/45 uppercase tracking-widest">Message</Label>
                    <Textarea
                      placeholder="Tell us as much as you can — order number, issue description, screenshots if available…"
                      className="bg-white/4 border-white/10 text-white placeholder:text-white/25 focus:border-primary resize-none text-sm"
                      rows={6}
                      value={form.message}
                      onChange={field("message")}
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-white/30">We'll reply within 24 hours</p>
                    <Button
                      type="submit"
                      className="h-11 px-7 font-semibold btn-glow shadow-lg shadow-primary/25 transition-all"
                      disabled={loading}
                    >
                      {loading ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</>
                      ) : (
                        <><Send className="h-4 w-4 mr-2" />Send message</>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
