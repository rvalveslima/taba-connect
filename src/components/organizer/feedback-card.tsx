import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquare, Send, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { submitFeedback } from "@/lib/feedback.functions";

export function FeedbackCard() {
  const [open, setOpen] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const send = useServerFn(submitFeedback);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = message.trim();
    if (trimmed.length === 0) {
      setError("Please write a message before sending.");
      return;
    }
    if (trimmed.length > 2000) {
      setError("Message must be 2000 characters or fewer.");
      return;
    }
    setSubmitting(true);
    try {
      await send({
        data: {
          subject: subject.trim() || undefined,
          message: trimmed,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
        },
      });
      setSent(true);
      setSubject("");
      setMessage("");
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      toast.error("Couldn't send your message", { description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2.5">
          <MessageSquare className="h-5 w-5 text-primary" />
          <span className="font-heading text-base font-semibold">Questions or feedback?</span>
        </span>
        {open ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {sent && !open && (
        <p className="mt-3 text-sm text-muted-foreground">
          Thanks — we read every message.{" "}
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setOpen(true);
            }}
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Send another
          </button>
        </p>
      )}

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={120}
            placeholder="Subject (optional)"
            className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            rows={5}
            placeholder="Write your message here…"
            className="w-full resize-y rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            required
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={submitting || message.trim().length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Sending…" : "Send message"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
