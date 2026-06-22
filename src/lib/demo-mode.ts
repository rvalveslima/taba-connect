import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Toggle this to `false` after the hackathon demo to hide the
 * "I'm here for the demo" button everywhere.
 */
export const DEMO_MODE_ENABLED = true;

export const DEMO_ORGANIZER_EMAIL = "demo@taba.events";
export const DEMO_ORGANIZER_PASSWORD = "Tabaevent123";
export const DEMO_EVENT_ID = "ea4535bb-930c-47ee-8b59-d54d11a281e6";

/**
 * Signs the current browser into the shared demo organizer account.
 * Returns true on success, false on failure (toast shown).
 */
export async function signInAsDemoOrganizer(): Promise<boolean> {
  try {
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithPassword({
      email: DEMO_ORGANIZER_EMAIL,
      password: DEMO_ORGANIZER_PASSWORD,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not start demo.";
    toast.error(msg);
    return false;
  }
}
