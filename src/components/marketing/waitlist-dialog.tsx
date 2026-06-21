import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
});

export function WaitlistDialog({
  open,
  onOpenChange,
  source,
  title = "Join as organizer",
  description = "We're onboarding organizers in waves. Drop your email and we'll be in touch.",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: string;
  title?: string;
  description?: string;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("organizer_waitlist")
      .insert({ email: parsed.data.email, source });
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        setDone(true);
        toast.success("You're already on the list — we'll be in touch.");
        return;
      }
      toast.error("Something went wrong. Try again?");
      return;
    }
    setDone(true);
    toast.success("You're on the list.");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setTimeout(() => {
            setEmail("");
            setDone(false);
          }, 200);
        }
      }}
    >
      <DialogContent className="rounded-none border-2 border-foreground bg-background sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="py-4">
            <p className="font-display text-lg text-foreground">
              You're on the list.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll reach out as we open more events. No spam.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <Input
              type="email"
              required
              autoFocus
              placeholder="you@yourevent.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-none border-2 border-foreground bg-background"
            />
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-none"
            >
              {submitting ? "Adding…" : "Join waitlist"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
