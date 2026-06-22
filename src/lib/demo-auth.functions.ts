import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Mints a one-time magic-link token for the fixed demo accounts so the
 * "I'm here for the demo" buttons can sign users in without shipping a
 * shared password to the client. We also rotate the demo account's
 * password on every call so any previously leaked password is neutralized.
 */
export const createDemoSession = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ role: z.enum(["organizer", "attendee"]) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email =
      data.role === "organizer" ? "demo@taba.events" : "demo-attendee@taba.events";

    // Best-effort password rotation so the historical hardcoded password no
    // longer grants access. We do not depend on success here.
    try {
      const list = await supabaseAdmin.auth.admin.listUsers();
      const user = list.data?.users?.find((u) => u.email === email);
      if (user) {
        const fresh = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
        await supabaseAdmin.auth.admin.updateUserById(user.id, { password: fresh });
      }
    } catch {
      // ignore — magic link below is the actual sign-in path
    }

    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (error) throw error;

    const hashed_token = link?.properties?.hashed_token;
    if (!hashed_token) throw new Error("Could not start the demo session.");

    return { email, hashed_token };
  });
