import { useEffect, useState } from "react";
import { AdminLayout } from "./layout";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Mail, Search } from "lucide-react";

type MessageStatus = "new" | "in_review" | "resolved" | "archived";

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: MessageStatus;
  createdAt: string;
};

const STATUS_LABELS: Record<MessageStatus, string> = {
  new: "New",
  in_review: "In Review",
  resolved: "Resolved",
  archived: "Archived",
};

const STATUS_COLORS: Record<MessageStatus, string> = {
  new: "text-amber-400 bg-amber-950/50 border-amber-800",
  in_review: "text-blue-400 bg-blue-950/50 border-blue-800",
  resolved: "text-emerald-400 bg-emerald-950/50 border-emerald-800",
  archived: "text-slate-400 bg-slate-800 border-slate-600",
};

const STATUSES: MessageStatus[] = ["new", "in_review", "resolved", "archived"];

export default function AdminMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMessages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/contact");
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      setMessages([]);
      setError("Messages are unavailable until the API server is running.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const updateStatus = async (id: number, status: MessageStatus) => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/admin/contact/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error(await response.text());
      await loadMessages();
    } catch {
      setError("Could not update message status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = messages.filter((message) => {
    const q = search.toLowerCase();
    return (
      !q ||
      message.name.toLowerCase().includes(q) ||
      message.email.toLowerCase().includes(q) ||
      message.subject.toLowerCase().includes(q) ||
      message.message.toLowerCase().includes(q)
    );
  });

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <p className="text-slate-400 text-sm mt-0.5">{filtered.length} customer inquiries</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search messages..."
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-9 pr-4 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:border-primary"
          />
        </div>

        <div className="grid gap-3">
          {error && (
            <div className="rounded-xl border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
              {error}
            </div>
          )}
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-28 bg-slate-800 rounded-xl" />
            ))
          ) : filtered.length > 0 ? (
            filtered.map((message) => (
              <article key={message.id} className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-white font-semibold">{message.subject}</span>
                      <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", STATUS_COLORS[message.status] ?? STATUS_COLORS.new)}>
                        {STATUS_LABELS[message.status] ?? message.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>{message.name}</span>
                      <a className="inline-flex items-center gap-1 text-primary hover:underline" href={`mailto:${message.email}`}>
                        <Mail className="h-3.5 w-3.5" />
                        {message.email}
                      </a>
                      <span>{formatDate(message.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{message.message}</p>
                  </div>
                  <select
                    value={message.status}
                    disabled={updatingId === message.id}
                    onChange={(event) => updateStatus(message.id, event.target.value as MessageStatus)}
                    className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-primary"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                    ))}
                  </select>
                </div>
              </article>
            ))
          ) : (
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-12 text-center text-slate-500">
              No messages found.
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
