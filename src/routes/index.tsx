import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Taba — build your own village" },
      {
        name: "description",
        content:
          "Taba helps event attendees leave with 2-3 real connections instead of a stack of unused contacts.",
      },
      { property: "og:title", content: "Taba — build your own village" },
      {
        property: "og:description",
        content:
          "Depth over volume. Filter by goal, role, and industry. See who's open to connect before you approach.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
      <h1 className="text-4xl font-semibold tracking-tight">Taba</h1>
      <p className="max-w-md text-center text-muted-foreground">
        Build your own village. Real connections at events — chosen, not collected.
      </p>
      <Link
        to="/auth"
        className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Log in as attendee
      </Link>
      <p className="text-xs text-muted-foreground">
        Placeholder homepage — full marketing site comes next.
      </p>
    </div>
  );
}
