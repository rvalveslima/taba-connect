import { z } from "zod";


const trim = (s: unknown) => (typeof s === "string" ? s.trim() : s);



export const profileSchema = z.object({
  name: z.preprocess(trim, z.string().min(1, "Name is required").max(100, "Name is too long")),
  role: z.preprocess(trim, z.string().max(120, "Role is too long").optional().nullable()),
  company: z.preprocess(trim, z.string().max(120, "Company is too long").optional().nullable()),
  location: z.preprocess(trim, z.string().max(120, "Location is too long").optional().nullable()),
  linkedin_handle: z.preprocess(trim, z.string().max(200).optional().nullable()),
  languages: z.array(z.string().trim().min(1).max(40)).max(20, "Too many languages"),
  goal_tags: z
    .array(z.string().trim().min(1, "Tag is empty").max(40, "Tag is too long"))
    .max(30, "Too many tags"),

  looking_for: z.preprocess(trim, z.string().max(500, "Keep it under 500 characters").optional().nullable()),
  give_back: z.preprocess(trim, z.string().max(500, "Keep it under 500 characters").optional().nullable()),
});

export type ProfileInput = z.infer<typeof profileSchema>;

/**
 * Normalize a LinkedIn input to a bare handle.
 * Accepts: full URL, linkedin.com/in/<handle>, /in/<handle>, /<handle>, <handle>.
 * Returns null for empty input. Throws on unsafe / malformed input.
 */
export function normalizeLinkedin(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let v = raw.trim();
  if (!v) return null;

  // Block anything that looks like an alternative scheme or HTML injection.
  if (/[<>"'\s]/.test(v)) {
    throw new Error("LinkedIn looks invalid — paste your handle or profile URL.");
  }

  // Strip protocol + host.
  v = v.replace(/^https?:\/\//i, "").replace(/^(www\.)?linkedin\.com/i, "");
  // Pull the segment after /in/ if present.
  const inMatch = v.match(/\/in\/([^/?#]+)/i);
  if (inMatch) v = inMatch[1];
  // Drop leading slashes, trailing slashes, query, hash.
  v = v.replace(/^\/+/, "").replace(/[/?#].*$/, "");

  if (!/^[A-Za-z0-9\-_.]{2,100}$/.test(v)) {
    throw new Error("LinkedIn handle can only contain letters, numbers, dots, dashes, and underscores.");
  }
  return v;
}

export function linkedinUrl(handle: string | null | undefined): string | null {
  if (!handle) return null;
  return `https://www.linkedin.com/in/${encodeURIComponent(handle)}`;
}
