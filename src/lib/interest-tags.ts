// Fixed tag set so overlap is reliable across users.
// Free-text would fragment matches; chips guarantee real intersection.
export const INTEREST_TAGS = [
  "Product",
  "Engineering",
  "Design",
  "Marketing",
  "Sales",
  "Operations",
  "AI / ML",
  "Data",
  "Startups",
  "Fundraising",
  "Hiring",
  "Career change",
  "Leadership",
  "Mentorship",
  "Public speaking",
  "Community building",
  "Open source",
  "Writing",
  "Research",
  "Climate",
  "Health tech",
  "Fintech",
  "Education",
  "Creator economy",
] as const;

export type InterestTag = (typeof INTEREST_TAGS)[number];

export function overlapTags(a: string[] | null, b: string[] | null): string[] {
  if (!a || !b) return [];
  const setB = new Set(b);
  return a.filter((t) => setB.has(t));
}
