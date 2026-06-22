import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createDemoSession } from "./demo-auth.functions";
import { friendlyError } from "./supabase-errors";

/**
 * Toggle this to `false` after the hackathon demo to hide the
 * "I'm here for the demo" button everywhere.
 */
export const DEMO_MODE_ENABLED = true;

export const DEMO_ORGANIZER_EMAIL = "demo@taba.events";
export const DEMO_EVENT_ID = "ea4535bb-930c-47ee-8b59-d54d11a281e6";

export const DEMO_ATTENDEE_EMAIL = "demo-attendee@taba.events";
export const DEMO_ATTENDEE_ACCOUNT_ID = "deadbeef-0000-4000-8000-000000000002";

/** Marker stored in seeded fake-attendee `linkedin_handle`. */
export const FAKE_PROFILE_MARKER = "__demo_fake__";

export function isDemoFakeProfile(linkedinHandle: string | null | undefined): boolean {
  return linkedinHandle === FAKE_PROFILE_MARKER;
}

async function signInAsDemo(role: "organizer" | "attendee"): Promise<boolean> {
  try {
    await supabase.auth.signOut();
    const { hashed_token } = await createDemoSession({ data: { role } });
    const { error } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: hashed_token,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    toast.error(friendlyError(err, "Could not start the demo. Refresh and try again."));
    return false;
  }
}

export function signInAsDemoOrganizer(): Promise<boolean> {
  return signInAsDemo("organizer");
}

export function signInAsDemoAttendee(): Promise<boolean> {
  return signInAsDemo("attendee");
}
