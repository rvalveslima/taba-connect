import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TabaLogo } from "@/components/taba-logo";
import { OverlapCircles } from "@/components/overlap-circles";
import { Reveal } from "@/components/marketing/reveal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { friendlyError } from "@/lib/supabase-errors";
import { DEMO_MODE_ENABLED, signInAsDemoOrganizer } from "@/lib/demo-mode";

const WAITLIST_ANCHOR = "early-access";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Taba — networking that becomes your event's standout feature" },
      {
        name: "description",
        content:
          "Taba turns event networking into real, measurable connections — so attendees leave with people they'll still be talking to next month, and you have the numbers to prove it.",
      },
      { property: "og:title", content: "Taba — become a founding organizer" },
      {
        property: "og:description",
        content:
          "For event organizers: make networking your standout feature and get the numbers to prove it. Founding organizers run their first events free.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: MarketingPage,
});

function scrollToWaitlist() {
  const el = document.getElementById(WAITLIST_ANCHOR);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function MarketingPage() {
  const goWaitlist = () => scrollToWaitlist();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      
      <Hero onJoin={goWaitlist} />
      <Problem />
      <VillageStory />
      <HowItWorks />
      <NotAnotherPlatform />
      <WhatYouGetBack />
      <EarlyAccess />
      <FinalCTA onJoin={goWaitlist} />
      <Footer />
    </div>
  );
}

/* ---------------- HERO ---------------- */

function Hero({ onJoin }: { onJoin: () => void }) {
  return (
    <section className="relative overflow-hidden border-b-2 border-foreground">
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
              Your event brings great people together.{" "}
              <span className="text-primary">
                Taba makes sure they actually connect.
              </span>
            </h1>
          </Reveal>
          <Reveal variant="fade-up" delay={240}>
            <p className="mt-8 max-w-xl text-lg text-foreground/80 sm:text-xl">
              Attendees who leave with real connections rate the event higher,
              come back, and bring people with them. Taba makes networking{" "}
              <span className="font-semibold text-foreground">
                your event's standout feature
              </span>{" "}
              — and gives you the numbers to prove it worked.
            </p>
          </Reveal>

          <Reveal variant="fade-up" delay={360}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button
                onClick={onJoin}
                size="lg"
                className="rounded-none px-7 py-6 font-display text-base uppercase tracking-wider"
              >
                Become a founding organizer →
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
              Your attendees don't need more people to meet.
              <br />
              <span className="text-primary">
                They need to know who's worth talking to.
              </span>
            </h2>
          </Reveal>
        </div>
        <div className="space-y-8 lg:col-span-7 lg:pt-2">
          <Reveal variant="fade-up">
            <p className="text-xl leading-relaxed text-foreground/85">
              Here's the loop that plays out at almost every event: an attendee
              shows up, scans a room full of strangers with no way to tell who
              shares their goals or who's open to talking. They play it safe.
              They add a few people on LinkedIn on the way out. Nobody follows
              up. The connection dies.
            </p>
          </Reveal>
          <InkRule />
          <Reveal variant="fade-up" delay={120}>
            <p className="text-xl leading-relaxed text-foreground/85">
              When we asked attendees what would actually change this, the
              answer was the same every time: they want to know what they have
              in common with someone — and whether that person is open to
              connecting — <em>before</em> they walk over.
            </p>
          </Reveal>
          <Reveal variant="fade-up" delay={240}>
            <p className="text-xl leading-relaxed text-foreground">
              The room is never the problem.{" "}
              <span className="font-semibold text-primary">
                Not knowing who's standing in it is.
              </span>{" "}
              And it's your event that gets remembered as "fine" because of it.
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
            <Reveal variant="fade-up" delay={240}>
              <p className="text-lg leading-relaxed text-background/85">
                Volume doesn't build that. A village does. That's what Taba is
                for.
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
      n: "00",
      title: "You share one link",
      body: "Create your event, get a join link, drop it in your confirmation email. That's the whole setup.",
      shape: <InkSquare className="h-16 w-16" />,
    },
    {
      n: "01",
      title: "Join the event",
      body: "An organizer shares a join link. One tap in the browser, and they're in.",
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
            <Reveal variant="fade-up">
              <p className="mb-4 font-display text-xs uppercase tracking-[0.25em] text-primary">
                03 — How it works
              </p>
            </Reveal>
            <Reveal variant="fade-up" delay={120}>
              <h2 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                One step for you. Three for them.
              </h2>
            </Reveal>
          </div>
        </div>

        <div className="grid gap-px border-2 border-foreground bg-foreground sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.n} variant="fade-up" delay={i * 140}>
              <div className="flex h-full flex-col gap-6 bg-background p-8">
                <div className="flex items-start justify-between">
                  <span className="font-display text-3xl font-bold text-primary">
                    {s.n}
                  </span>
                  <span className="anim-float" style={{ animationDelay: `${i * 600}ms` }}>{s.shape}</span>
                </div>
                <h3 className="font-display text-2xl font-bold leading-tight">
                  {s.title}
                </h3>
                <p className="text-foreground/80">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- NOT ANOTHER PLATFORM ---------------- */

function NotAnotherPlatform() {
  return (
    <section className="relative border-b-2 border-foreground bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-24 lg:grid-cols-12 lg:px-10 lg:py-28">
        <div className="lg:col-span-4">
          <Reveal variant="fade-up">
            <p className="mb-4 font-display text-xs uppercase tracking-[0.25em] text-primary">
              04 — Not another platform
            </p>
          </Reveal>
          <Reveal variant="fade-up" delay={120}>
            <h2 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              You already run enough tools. This isn't one of them.
            </h2>
          </Reveal>
        </div>
        <div className="space-y-6 lg:col-span-8 lg:pt-2">
          <Reveal variant="fade-up">
            <p className="text-xl leading-relaxed text-foreground/85">
              Your event website, your registration, your agenda app — Taba
              doesn't replace any of it, and doesn't ask to be integrated with
              it. It's one link. Attendees tap it in the browser: no app
              download, no new account to manage, no support tickets landing on
              you.
            </p>
          </Reveal>
          <Reveal variant="fade-up" delay={120}>
            <p className="text-xl leading-relaxed text-foreground/85">
              And it's built for a single event — not another community platform
              demanding ongoing engagement from you or your attendees. One
              event. Real depth. Then out of everyone's way.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- WHAT YOU GET BACK ---------------- */

function WhatYouGetBack() {
  return (
    <section className="relative border-b-2 border-foreground bg-background">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-24 lg:grid-cols-12 lg:px-10 lg:py-28">
        <div className="lg:col-span-5">
          <Reveal variant="fade-up">
            <p className="mb-4 font-display text-xs uppercase tracking-[0.25em] text-primary">
              05 — What you get back
            </p>
          </Reveal>
          <Reveal variant="fade-up" delay={120}>
            <h2 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Networking you can finally put a number on.
            </h2>
          </Reveal>
        </div>
        <div className="space-y-6 lg:col-span-7 lg:pt-2">
          <Reveal variant="fade-up">
            <p className="text-xl leading-relaxed text-foreground/85">
              Taba counts a connection only when two people actually message
              each other — both ways. Not profile views, not badge scans, not
              LinkedIn adds. Real conversations.
            </p>
          </Reveal>
          <Reveal variant="fade-up" delay={120}>
            <p className="text-xl leading-relaxed text-foreground/85">
              After your event, you know exactly how many connections it
              created. Put it in your recap email. Show it to your sponsors.
              Lead your next campaign with it:{" "}
              <em className="text-foreground">
                "Attendees made 214 real connections last time. Come make
                yours."
              </em>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- EARLY ACCESS (waitlist) ---------------- */

const waitlistSchema = z.object({
  email: z.string().trim().email().max(255),
});

function EarlyAccess() {
  const [email, setEmail] = useState("");
  const [openToChat, setOpenToChat] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = waitlistSchema.safeParse({ email });
    if (!parsed.success) {
      toast.error("Enter a valid email");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("organizer_waitlist")
      .insert({
        email: parsed.data.email,
        source: "early_access",
        open_to_chat: openToChat,
      });
    setSubmitting(false);
    if (error && error.code !== "23505") {
      toast.error(friendlyError(error, "We couldn't add you to the waitlist. Try again."));
      return;
    }
    setDone(true);
    toast.success("You're in. We'll be in touch soon.");
  }

  return (
    <section
      id={WAITLIST_ANCHOR}
      className="relative overflow-hidden border-b-2 border-foreground bg-background scroll-mt-24"
    >
      <ClayCircle className="anim-drift pointer-events-none absolute -left-20 -bottom-20 hidden h-60 w-60 opacity-90 sm:block" />
      <InkSquare className="anim-spin pointer-events-none absolute right-[12%] top-12 hidden h-6 w-6 sm:block" />

      <div className="relative mx-auto max-w-5xl px-6 py-24 lg:px-10 lg:py-28">
        <Reveal variant="scale-in">
          <div className="border-2 border-foreground bg-background p-10 lg:p-14">
            <p className="mb-4 font-display text-xs uppercase tracking-[0.25em] text-primary">
              06 — Early access
            </p>
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              Be a founding organizer.
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-foreground/80">
              Taba is opening to a small group of organizers first. Founding
              organizers run their first events free, get a direct line to shape
              what gets built, and lock in early-access terms before public
              plans exist.
            </p>

            {done ? (
              <p className="mt-8 font-display text-lg text-foreground">
                You're in. We'll be in touch soon.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
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
                    {submitting ? "Adding…" : "Get early access"}
                  </Button>
                </div>
                <label className="flex items-start gap-3 text-sm text-foreground/80">
                  <Checkbox
                    checked={openToChat}
                    onCheckedChange={(v) => setOpenToChat(v === true)}
                    className="mt-0.5 rounded-none border-2 border-foreground"
                  />
                  <span>
                    I'm open to a 20-minute chat about how networking works at
                    my events.
                  </span>
                </label>
              </form>
            )}

            {DEMO_MODE_ENABLED && <DemoLink />}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function DemoLink() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  return (
    <p className="mt-6 text-sm text-foreground/70">
      Want to see it in action first?{" "}
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          const ok = await signInAsDemoOrganizer();
          if (ok) navigate({ to: "/organizer", replace: true });
          else setLoading(false);
        }}
        className="font-medium text-foreground underline decoration-primary decoration-2 underline-offset-4 hover:opacity-80 disabled:opacity-60"
      >
        {loading ? "Starting demo…" : "Try the live demo →"}
      </button>
    </p>
  );
}

/* ---------------- FINAL CTA ---------------- */

function FinalCTA({ onJoin }: { onJoin: () => void }) {
  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="anim-drift pointer-events-none absolute -right-32 -top-32 hidden h-[520px] w-[520px] rounded-full border-2 border-primary-foreground/40 sm:block" />
      <CobaltTriangle className="anim-float pointer-events-none absolute left-[10%] bottom-10 hidden h-40 w-40 opacity-90 sm:block" />
      <GrainOverlay />

      <div className="relative mx-auto max-w-7xl px-6 py-28 text-center lg:px-10 lg:py-36">
        <Reveal variant="fade-up">
          <p className="mb-6 font-display text-xs uppercase tracking-[0.3em]">
            07 — Your village, your event
          </p>
        </Reveal>
        <Reveal variant="fade-up" delay={120}>
          <h2 className="mx-auto max-w-4xl font-display text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            Stop collecting contacts.
            <br />
            Start building villages.
          </h2>
        </Reveal>
        <Reveal variant="scale-in" delay={280}>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Button
              onClick={onJoin}
              size="lg"
              variant="secondary"
              className="rounded-none border-2 border-foreground bg-background px-8 py-6 font-display text-base uppercase tracking-wider text-foreground hover:bg-background/90"
            >
              Become a founding organizer →
            </Button>
          </div>
        </Reveal>
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
