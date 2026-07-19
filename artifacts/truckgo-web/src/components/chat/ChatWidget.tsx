import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Loader2, Minimize2, Bot, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: Date;
}

const GREETING: Message = {
  id: "welcome",
  role: "assistant",
  content: "Hi there! 👋 I'm **TruckGo Support**. I can help you with bookings, pricing, live tracking, driver sign-ups, and more. What can I help you with today?",
  ts: new Date(),
};

const QUICK_PROMPTS = [
  "How does pricing work?",
  "How do I track my delivery?",
  "How do I cancel a booking?",
  "How do I become a driver?",
];

function renderMarkdown(text: string) {
  // Very lightweight markdown: **bold** and line breaks
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white/6 border border-white/8">
        <div className="flex items-center gap-1">
          {[0, 0.15, 0.3].map((delay, i) => (
            <div
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-white/40 animate-bounce"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimised, setMinimised] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (open && !minimised) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typing, open, minimised]);

  // Focus input when panel opens
  useEffect(() => {
    if (open && !minimised) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open, minimised]);

  // Track unread while closed
  useEffect(() => {
    if (!open || minimised) {
      const last = messages[messages.length - 1];
      if (last?.role === "assistant" && last.id !== "welcome") {
        setUnread(u => u + 1);
      }
    }
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpen = () => {
    setOpen(true);
    setMinimised(false);
    setUnread(0);
  };

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      ts: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Build history for API (exclude greeting id)
    const history = [...messages, userMsg]
      .filter(m => m.id !== "welcome")
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`${base}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.content,
          ts: new Date(),
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I couldn't connect right now. Please try again or contact us via the Contact page.",
          ts: new Date(),
        },
      ]);
    } finally {
      setTyping(false);
    }
  }, [messages, typing, base]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const resetChat = () => {
    setMessages([GREETING]);
    setInput("");
    setTyping(false);
  };

  return (
    <>
      {/* ── Chat panel ── */}
      <div
        className={cn(
          "fixed bottom-24 right-5 z-50 flex flex-col transition-all duration-300 origin-bottom-right",
          "w-[360px] sm:w-[400px] shadow-2xl",
          open && !minimised ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"
        )}
        style={{ maxHeight: "calc(100vh - 120px)" }}
      >
        <div className="flex flex-col rounded-2xl overflow-hidden border border-white/12 shadow-2xl shadow-black/60"
          style={{ background: "#0c0d1a", height: "520px" }}>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8 shrink-0"
            style={{ background: "linear-gradient(135deg,rgba(244,133,37,0.12),rgba(244,133,37,0.04))" }}>
            <div className="h-9 w-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Bot className="h-4.5 w-4.5 text-primary" style={{ height: 18, width: 18 }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">TruckGo Support</p>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-white/40">Online · typically replies instantly</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={resetChat}
                title="Reset chat"
                className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/6 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setMinimised(true)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/6 transition-all"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex items-end gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 mb-0.5">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-sm shadow-lg shadow-primary/20"
                      : "bg-white/6 border border-white/8 text-white/80 rounded-bl-sm"
                  )}
                >
                  {renderMarkdown(msg.content)}
                  <div className={cn("text-[10px] mt-1.5", msg.role === "user" ? "text-white/50 text-right" : "text-white/25")}>
                    {msg.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts — shown only when fresh */}
          {messages.length === 1 && !typing && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-xs px-3 py-1.5 rounded-full border border-white/12 bg-white/4 text-white/60 hover:border-primary/40 hover:text-white hover:bg-primary/8 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-4 pt-3 border-t border-white/8 shrink-0">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 focus-within:border-primary/40 transition-colors">
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask anything…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={typing}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || typing}
                className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/80 shadow-md shadow-primary/30"
              >
                {typing
                  ? <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                  : <Send className="h-3.5 w-3.5 text-white" />}
              </button>
            </div>
            <p className="text-center text-[10px] text-white/20 mt-2">
              AI-powered support · <span className="text-white/30">TruckGo</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Minimised bar ── */}
      {open && minimised && (
        <div
          className="fixed bottom-5 right-5 z-50 cursor-pointer flex items-center gap-3 px-4 py-3 rounded-2xl border border-primary/30 shadow-xl shadow-black/50 transition-all hover:border-primary/60"
          style={{ background: "linear-gradient(135deg,rgba(244,133,37,0.2),rgba(244,133,37,0.08))", backdropFilter: "blur(20px)" }}
          onClick={() => setMinimised(false)}
        >
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-white">TruckGo Support</span>
          <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        </div>
      )}

      {/* ── Trigger button ── */}
      {!open && (
        <button
          id="chat-widget-trigger"
          onClick={handleOpen}
          className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-primary shadow-xl shadow-primary/40 flex items-center justify-center transition-all hover:scale-110 hover:shadow-primary/60 btn-glow group"
          aria-label="Open chat"
        >
          <MessageSquare className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#07080f]">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      )}
    </>
  );
}
