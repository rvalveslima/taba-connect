import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [{ title: "Taba — Signed in" }],
  }),
  component: AuthedHome,
});

function AuthedHome() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <h1 className="text-2xl font-semibold">Signed in</h1>
      <p className="text-sm text-muted-foreground">{email}</p>
      <p className="text-xs text-muted-foreground">
        Gate works. Attendee flow lands here next.
      </p>
      <button
        onClick={handleSignOut}
        className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
      >
        Sign out
      </button>
    </div>
  );
}
