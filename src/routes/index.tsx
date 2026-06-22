import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TabaLogo } from "@/components/taba-logo";
import { OverlapCircles } from "@/components/overlap-circles";
import { Reveal } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ClayCircle,
  CobaltTriangle,
  InkSquare,
  InkRule,
  GridLines,
  GrainOverlay,
} from "@/components/marketing/geometric";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Taba — build your own village at your event" },
      {
        name: "description",
        content:
          "Events generate contacts, not connections. Taba helps attendees leave with 2–3 real connections instead of a pile of LinkedIn adds.",
      },
      { property: "og:title", content: "Taba — build your own village" },
      {
        property: "og:description",
        content:
          "Depth over volume. A handful of chosen connections, not a crowd of contacts. For organizers building events that matter.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: MarketingPage,
});

function MarketingPage() {
  const navigate = useNavigate();
  const goOrganizer = () =>
    navigate({ to: "/auth", search: { as: "organizer" } as never });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav onJoin={goOrganizer} />
      <Hero onJoin={goOrganizer} />
      <Problem />
      <VillageStory />
      <HowItWorks />
      <WhoItsFor />
      <PricingTeaser />
      <FinalCTA onJoin={goOrganizer} />
      <Footer />
    </div>
  );
}

/* ---------------- NAV ---------------- */

function Nav({ onJoin }: { onJoin: () => void }) {
  return (
    <header className="relative z-20 border-b-2 border-foreground bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-10">
        <TabaLogo height={32} />
        <Button
          onClick={onJoin}
          className="shrink-0 rounded-none px-3 py-2 font-display text-[11px] uppercase tracking-wider sm:px-5 sm:text-sm"
        >
          <span className="sm:hidden">Organize</span>
          <span className="hidden sm:inline">Join as organizer</span>
        </Button>
      </div>
    </header>
  );
}

/* ---------------- HERO ---------------- */

function Hero({ onJoin }: { onJoin: () => void }) {
  return (
    <section className="relative overflow-hidden border-b-2 border-foreground">
      {/* Geometric backdrop */}
      <GridLines className="absolute inset-0 h-full w-full" />
      <ClayCircle className="anim-drift pointer-events-none absolute -right-32 -top-32 hidden h-[420px] w-[420px] opacity-95 sm:block" />
      <CobaltTriangle className="anim-float pointer-events-none absolute -bottom-16 left-[8%] hidden h-56 w-56 opacity-90 sm:block" />
      <InkSquare className="anim-spin pointer-events-none absolute right-[18%] top-1/2 hidden h-10 w-10 -translate-y-1/2 sm:block" />
      <GrainOverlay />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:py-24 lg:grid-cols-12 lg:gap-8 lg:px-10 lg:py-32">
        <div className="relative lg:col-span-8">
          <div className="mb-8 text-foreground sm:mb-10">
            <TabaLogo height={84} animateConnect className="sm:hidden" />
            <TabaLogo height={120} animateConnect className="hidden sm:block" />
          </div>
          <Reveal variant="fade-up">
            <p className="mb-6 inline-block border-2 border-foreground bg-background px-3 py-1 font-display text-xs uppercase tracking-[0.2em]">
              For event organizers
            </p>
          </Reveal>
          <Reveal variant="fade-up" delay={120}>
            <h1 className="font-display text-[2rem] font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
              The hardest part of networking isn't talking to people.{" "}
              <span className="text-primary">It's knowing who to talk to.</span>
            </h1>
          </Reveal>
          <Reveal variant="fade-up" delay={240}>
            <p className="mt-8 max-w-xl text-lg text-foreground/80 sm:text-xl">
              Taba helps you find the people who are{" "}
              <span className="font-semibold text-foreground">
                aligned with where you're headed
              </span>{" "}
              — so you don't have to guess who's worth approaching.
            </p>
          </Reveal>

          <Reveal variant="fade-up" delay={360}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button
                onClick={onJoin}
                size="lg"
                className="rounded-none px-7 py-6 font-display text-base uppercase tracking-wider"
              >
                Join as organizer →
              </Button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- PROBLEM ---------------- */

function Problem() {
  return (
    <section className="relative border-b-2 border-foreground bg-background">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 py-24 lg:grid-cols-12 lg:px-10 lg:py-32">
        <div className="lg:col-span-5">
          <Reveal variant="fade-up">
            <p className="mb-4 font-display text-xs uppercase tracking-[0.25em] text-primary">
              01 — The problem
            </p>
          </Reveal>
          <Reveal variant="fade-up" delay={120}>
            <h2 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              You don't need more people to meet.
              <br />
              <span className="text-primary">
                You need to know who's worth talking to.
              </span>
            </h2>
          </Reveal>
        </div>
        <div className="space-y-8 lg:col-span-7 lg:pt-2">
          <Reveal variant="fade-up">
            <p className="text-xl leading-relaxed text-foreground/85">
              90% of people say they've walked past a great connection at an
              event — and never even knew it.
            </p>
          </Reveal>
          <InkRule />
          <Reveal variant="fade-up" delay={120}>
            <p className="text-xl leading-relaxed text-foreground/85">
              In person, you're scanning a room full of strangers with no way to
              tell who's open to connect, or who's actually working toward
              something like what you are. Online, it's worse: a hundred LinkedIn
              links land in your inbox with zero context — no way to filter
              who's actually worth a conversation.
            </p>
          </Reveal>
          <Reveal variant="fade-up" delay={240}>
            <p className="text-xl leading-relaxed text-foreground">
              The room is never the problem.{" "}
              <span className="font-semibold text-primary">
                Not knowing who's standing in it is.
              </span>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}


/* ---------------- VILLAGE STORY ---------------- */

function VillageStory() {
  return (
    <section className="relative overflow-hidden border-b-2 border-foreground bg-foreground text-background">
      {/* big abstract composition */}
      <div className="anim-drift pointer-events-none absolute -left-32 top-20 hidden h-[520px] w-[520px] rounded-full border-2 border-background/40 sm:block" />
      <div
        className="anim-float pointer-events-none absolute right-[-280px] bottom-[-280px] hidden h-[560px] w-[560px] opacity-80 sm:block"
        style={{
          background: "var(--primary)",
          borderRadius: "9999px",
        }}
      />
      <CobaltTriangle className="anim-spin pointer-events-none absolute left-1/2 top-10 hidden h-32 w-32 opacity-90 sm:block" />
      <GrainOverlay />

      <div className="relative mx-auto max-w-7xl px-6 py-28 lg:px-10 lg:py-40">
        <Reveal variant="fade-up">
          <p className="mb-6 font-display text-xs uppercase tracking-[0.3em] text-primary">
            02 — The village
          </p>
        </Reveal>

        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Reveal variant="fade-up" delay={120}>
              <h2 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-background sm:text-6xl lg:text-7xl">
                Build your own
                <br />
                <span className="text-primary">village.</span>
              </h2>
            </Reveal>
          </div>

          <div className="lg:col-span-5 lg:pt-4">
            <Reveal variant="slide-left" delay={240}>
              <div className="border-l-2 border-background/40 pl-6">
                <p className="font-display text-sm uppercase tracking-[0.2em] text-background/60">
                  Taba
                </p>
                <p className="mt-2 text-lg leading-relaxed text-background/90">
                  From <span className="italic">Old Tupi</span>, an Indigenous
                  Brazilian language. It means{" "}
                  <span className="font-semibold text-background">village</span> —
                  but the meaning shifts with relationship and context. Not a
                  fixed place. A circle that forms around who's there and what
                  you share.
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="mt-20 grid items-center gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Reveal variant="scale-in">
              <div className="border-2 border-background/30 bg-foreground/40 p-10">
                <OverlapCircles className="mx-auto" />
                <p className="mt-6 text-center font-display text-sm uppercase tracking-[0.2em] text-background/70">
                  Shared ground, made visible
                </p>
              </div>
            </Reveal>
          </div>
          <div className="space-y-6 lg:col-span-7">
            <Reveal variant="fade-up">
              <p className="text-2xl leading-snug text-background sm:text-3xl">
                A village isn't a crowd. It's a handful of people who{" "}
                <span className="text-primary">chose each other</span> — because
                there was a reason to.
              </p>
            </Reveal>
            <Reveal variant="fade-up" delay={120}>
              <p className="text-lg leading-relaxed text-background/85">
                We asked people what they actually want before approaching
                someone at an event. The answer was simple, and the same every
                time: they want to know{" "}
                <span className="font-semibold text-background">
                  what they have in common
                </span>{" "}
                with that person, and{" "}
                <span className="font-semibold text-background">
                  how open they are to connecting
                </span>
                .
              </p>
            </Reveal>
            <Reveal variant="fade-up" delay={240}>
              <p className="text-lg leading-relaxed text-background/85">
                Volume doesn't answer either question. A village does. That's
                what Taba is for.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- HOW IT WORKS ---------------- */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Join the event",
      body: "An organizer shares a join link. One tap. No app store, no extra account.",
      shape: <ClayCircle className="h-16 w-16" />,
    },
    {
      n: "02",
      title: "See your common ground",
      body: "Filter the room by what you're actually here for. See who's open to connecting — before you walk over.",
      shape: <CobaltTriangle className="h-16 w-16" />,
    },
    {
      n: "03",
      title: "Start a real conversation",
      body: "Reach out with context. Leave with people you'll still be talking to next month.",
      shape: <InkSquare className="h-16 w-16" />,
    },
  ];

  return (
    <section className="relative border-b-2 border-foreground bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-4 font-display text-xs uppercase tracking-[0.25em] text-primary">
              03 — How it works
            </p>
            <h2 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Three steps. From an attendee's point of view.
            </h2>
          </div>
        </div>

        <div className="grid gap-px border-2 border-foreground bg-foreground sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="flex flex-col gap-6 bg-background p-8">
              <div className="flex items-start justify-between">
                <span className="font-display text-3xl font-bold text-primary">
                  {s.n}
                </span>
                {s.shape}
              </div>
              <h3 className="font-display text-2xl font-bold leading-tight">
                {s.title}
              </h3>
              <p className="text-foreground/80">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- WHO IT'S FOR ---------------- */

function WhoItsFor() {
  return (
    <section className="relative border-b-2 border-foreground bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-24 lg:grid-cols-12 lg:px-10 lg:py-28">
        <div className="lg:col-span-4">
          <p className="mb-4 font-display text-xs uppercase tracking-[0.25em] text-primary">
            04 — Positioning
          </p>
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Built for the event itself.
          </h2>
        </div>
        <div className="lg:col-span-8 lg:pt-2">
          <p className="text-xl leading-relaxed text-foreground/85">
            Taba is for a single event, where attendees decide who they want to
            meet — and how deep that goes. It isn't an algorithm matching you to
            strangers at scale, and it isn't another community platform asking
            for ongoing engagement.
          </p>
          <p className="mt-4 text-xl leading-relaxed text-foreground/85">
            One event. Real depth. Then out of your way.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- PRICING TEASER ---------------- */

const pricingSchema = z.object({
  email: z.string().trim().email().max(255),
});

function PricingTeaser() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = pricingSchema.safeParse({ email });
    if (!parsed.success) {
      toast.error("Enter a valid email");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("organizer_waitlist")
      .insert({ email: parsed.data.email, source: "pricing" });
    setSubmitting(false);
    if (error && error.code !== "23505") {
      toast.error("Something went wrong. Try again?");
      return;
    }
    setDone(true);
    toast.success("You're on the list.");
  }

  return (
    <section className="relative overflow-hidden border-b-2 border-foreground bg-background">
      <ClayCircle className="pointer-events-none absolute -left-20 -bottom-20 hidden h-60 w-60 opacity-90 sm:block" />
      <InkSquare className="pointer-events-none absolute right-[12%] top-12 hidden h-6 w-6 sm:block" />

      <div className="relative mx-auto max-w-5xl px-6 py-24 lg:px-10 lg:py-28">
        <div className="border-2 border-foreground bg-background p-10 lg:p-14">
          <p className="mb-4 font-display text-xs uppercase tracking-[0.25em] text-primary">
            05 — Pricing
          </p>
          <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Pricing for organizers is on the way.
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-foreground/80">
            Join the waitlist to be first to know when plans open up — and to
            lock in early-access pricing.
          </p>

          {done ? (
            <p className="mt-8 font-display text-lg text-foreground">
              You're on the list. We'll be in touch.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Input
                type="email"
                required
                placeholder="you@yourevent.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-none border-2 border-foreground bg-background sm:flex-1"
              />
              <Button
                type="submit"
                disabled={submitting}
                className="h-12 rounded-none px-7 font-display uppercase tracking-wider"
              >
                {submitting ? "Adding…" : "Notify me"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------- FINAL CTA ---------------- */

function FinalCTA({ onJoin }: { onJoin: () => void }) {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="pointer-events-none absolute -right-32 -top-32 hidden h-[520px] w-[520px] rounded-full border-2 border-primary-foreground/40 sm:block" />
      <CobaltTriangle className="pointer-events-none absolute left-[10%] bottom-10 hidden h-40 w-40 opacity-90 sm:block" />
      <GrainOverlay />

      <div className="relative mx-auto max-w-7xl px-6 py-28 text-center lg:px-10 lg:py-36">
        <p className="mb-6 font-display text-xs uppercase tracking-[0.3em]">
          06 — Your village, your event
        </p>
        <h2 className="mx-auto max-w-4xl font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
          Stop collecting contacts.
          <br />
          Start building villages.
        </h2>
        <div className="mt-12 flex justify-center">
          <Button
            onClick={onJoin}
            size="lg"
            variant="secondary"
            className="rounded-none border-2 border-foreground bg-background px-8 py-6 font-display text-base uppercase tracking-wider text-foreground hover:bg-background/90"
          >
            Join as organizer →
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- FOOTER ---------------- */

function Footer() {
  return (
    <footer className="border-t-2 border-foreground bg-background">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 lg:px-10">
        <TabaLogo height={28} />
        <div className="flex flex-col items-end gap-1">
          <p className="font-display text-xs uppercase tracking-[0.2em] text-muted-foreground">
            © {new Date().getFullYear()} Taba — Build your own village
          </p>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-xs uppercase tracking-[0.2em] text-foreground underline underline-offset-4 hover:text-primary"
          >
            Terms & Conditions
          </a>
        </div>
      </div>
    </footer>

  );
}
