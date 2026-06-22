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

export const DEMO_ATTENDEE_EMAIL = "demo-attendee@taba.events";
export const DEMO_ATTENDEE_PASSWORD = "Tabaevent123";
export const DEMO_ATTENDEE_ACCOUNT_ID = "deadbeef-0000-4000-8000-000000000002";

/** Marker stored in seeded fake-attendee `linkedin_handle`. */
export const FAKE_PROFILE_MARKER = "__demo_fake__";

export function isDemoFakeProfile(linkedinHandle: string | null | undefined): boolean {
  return linkedinHandle === FAKE_PROFILE_MARKER;
}

async function signInAs(email: string, password: string): Promise<boolean> {
  try {
    await supabase.auth.signOut();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Could not start demo.";
    toast.error(msg);
    return false;
  }
}

export function signInAsDemoOrganizer(): Promise<boolean> {
  return signInAs(DEMO_ORGANIZER_EMAIL, DEMO_ORGANIZER_PASSWORD);
}

export function signInAsDemoAttendee(): Promise<boolean> {
  return signInAs(DEMO_ATTENDEE_EMAIL, DEMO_ATTENDEE_PASSWORD);
}
