import { Router } from "express";

const router = Router();

// ---------------------------------------------------------------------------
// POST /chat
//
// AI-READY CHAT ENDPOINT
// ---------------------------------------------------------------------------
// Current behaviour: rule-based responses with TruckGo context.
//
// TO SWAP IN AN AI MODEL: replace the `getRuleBasedReply` call below with
// an OpenAI / Anthropic call. The request body already uses the OpenAI
// messages format, so integration is a drop-in:
//
//   import OpenAI from "openai";
//   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
//   const completion = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
//   });
//   const reply = completion.choices[0].message.content ?? "Sorry, I couldn't respond.";
//
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `
You are TruckGo Support, a helpful assistant for a freight delivery platform.
TruckGo connects customers who need to move goods with professional, insured truck drivers.
You help with: booking process, pricing, tracking, driver onboarding, cancellations, and general enquiries.
Be concise, friendly, and professional.
`.trim();

type MessageRole = "user" | "assistant" | "system";
interface ChatMessage { role: MessageRole; content: string; }

// ---------------------------------------------------------------------------
// Rule-based fallback (replace this function body with an AI call)
// ---------------------------------------------------------------------------
function getRuleBasedReply(messages: ChatMessage[]): string {
  const last = messages.filter(m => m.role === "user").pop();
  if (!last) return "How can I help you today?";

  const text = last.content.toLowerCase();

  if (/\b(pric(e|ing|es)|cost(s)?|how much|quote|estimate|charge|fee)\b/.test(text)) {
    return "Pricing is based on truck type and distance. You can get an **instant quote** on our home page — just enter your pickup and dropoff addresses and select a vehicle. No hidden fees, ever.";
  }
  if (/\b(track(ing)?|where is|location|live|map|gps)\b/.test(text)) {
    return "Once a driver accepts your booking, a **live tracking map** appears on your booking detail page. It updates every 8 seconds using the driver's GPS — no app download needed.";
  }
  if (/\b(cancel(l(ed|ing|ation))?|refund)\b/.test(text)) {
    return "You can cancel a booking **free of charge up to 30 minutes before pickup**. After that, a small cancellation fee may apply. Go to *My Bookings* → open the booking → tap Cancel.";
  }
  if (/\b(driver|become|sign up as|register as driver)\b/.test(text)) {
    return "To join as a driver, tap **Get started** → *Register as a Driver*. You'll need a valid driver's licence, your vehicle registration, and proof of insurance. Approval usually takes 1–2 business days.";
  }
  if (/\b(pay|payment|invoice|receipt|card|credit)\b/.test(text)) {
    return "TruckGo accepts all major credit and debit cards. You're charged only after the delivery is completed and confirmed. A receipt is emailed automatically.";
  }
  if (/\b(insurance|insured|cover|damage|claim)\b/.test(text)) {
    return "Every delivery is covered by **comprehensive cargo insurance up to $50,000**. If anything is damaged in transit, contact us within 48 hours with photos and we'll open a claim.";
  }
  if (/\b(how long|eta|time|when|arrive|arrives)\b/.test(text)) {
    return "Estimated delivery time is shown on your quote. Same-city deliveries typically take **1–3 hours** depending on distance and traffic. You can watch progress live on the map.";
  }
  if (/\b(truck|vehicle|size|capacity|type|van|ute)\b/.test(text)) {
    return "We offer several vehicle types: **Ute** (light loads), **Small Van**, **Large Van**, **Curtainsider**, and **Semi Trailer**. Each listing shows max capacity in kg — pick the one that fits your cargo.";
  }
  if (/\b(hello|hi|hey|good morning|good afternoon)\b/.test(text)) {
    return "Hi there! 👋 I'm TruckGo Support. I can help with booking, pricing, tracking, driver sign-ups, and more. What can I help you with today?";
  }
  if (/\b(thank|thanks|cheers|appreciate)\b/.test(text)) {
    return "You're welcome! Is there anything else I can help you with?";
  }
  if (/\b(contact|human|agent|speak|call|phone|email)\b/.test(text)) {
    return "To reach our team directly, use the **Contact** page — we respond within 24 hours. For urgent booking issues, call **1800 TRUCKGO** (24/7 dispatch line).";
  }
  if (/\b(area|city|region|country|interstate|where do you)\b/.test(text)) {
    return "TruckGo currently operates in **Sydney, Melbourne, Brisbane, and Perth**. Interstate routes between these cities are available — just enter your addresses and we'll show available drivers.";
  }

  return "I'm not sure I have the answer to that one! You can reach our support team directly via the **Contact** page, or ask me something else — I know a lot about bookings, pricing, tracking, and drivers.";
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------
router.post("/chat", async (req, res) => {
  const { messages } = req.body as { messages: ChatMessage[] };

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required." });
  }

  // ── Swap this block for your AI call ──────────────────────────────────────
  const reply = getRuleBasedReply(messages);
  // ─────────────────────────────────────────────────────────────────────────

  // Simulate a brief thinking delay so the UI typing indicator is visible
  await new Promise(r => setTimeout(r, 400 + Math.random() * 600));

  return res.json({ role: "assistant", content: reply });
});

export { SYSTEM_PROMPT };
export default router;
