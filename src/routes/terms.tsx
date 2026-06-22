import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Code of Conduct — Taba" },
      {
        name: "description",
        content:
          "Taba's terms of use and code of conduct for attendees joining events.",
      },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <article className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Terms & Code of Conduct
        </h1>
        <p className="mt-3 font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Last updated: June 21, 2026
        </p>

        <section className="prose prose-neutral mt-12 max-w-none">
          <h2 className="font-display text-2xl font-bold">Terms of Use</h2>

          <h3 className="mt-8 font-display text-xl font-semibold">1. What Taba is</h3>
          <p className="mt-2 leading-relaxed text-foreground/85">
            Taba is an event-based networking tool that helps attendees find a few real,
            meaningful connections at an event instead of a wall of contacts. By joining
            an event through Taba, you agree to these terms and the code of conduct below.
          </p>

          <h3 className="mt-8 font-display text-xl font-semibold">2. Your information</h3>
          <p className="mt-2 leading-relaxed text-foreground/85">
            When you join an event, we collect your first name, email address, LinkedIn
            URL, role, company, location, and your interests/hobbies for that event. We
            use this information to:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-foreground/85">
            <li>
              Show your profile card to other attendees at the same event, so they can
              see your role, location, and shared interests with them
            </li>
            <li>
              Let you and other attendees see what you have in common before deciding to
              message each other
            </li>
            <li>Enable in-app messaging between attendees at the same event</li>
          </ul>
          <p className="mt-4 leading-relaxed text-foreground/85">
            By joining an event, you consent to your name, role, company, location,
            LinkedIn URL, and event interests being visible to other attendees at that
            same event. Unlike a one-to-one matching service, Taba shows your profile to
            everyone at the event — you choose who to message, rather than being matched
            automatically. We will never sell your data or share it with third parties
            outside of running the event you've joined.
          </p>

          <h3 className="mt-8 font-display text-xl font-semibold">3. Your account</h3>
          <p className="mt-2 leading-relaxed text-foreground/85">
            You are responsible for the information you provide. Please use your real
            name and a valid email address. Your account (name, email, LinkedIn URL)
            persists across events, but your interests and visibility are specific to
            each event you join. You may leave an event, or stop participating, at any
            time through your dashboard settings.
          </p>

          <h3 className="mt-8 font-display text-xl font-semibold">4. Removal</h3>
          <p className="mt-2 leading-relaxed text-foreground/85">
            We reserve the right to remove any member from an event, or from Taba
            entirely, if they violate these terms or the code of conduct, without prior
            notice.
          </p>

          <h2 className="mt-14 font-display text-2xl font-bold">Code of Conduct</h2>
          <p className="mt-2 leading-relaxed text-foreground/85">
            Taba is built on respect, curiosity, and genuine human connection. Every
            attendee is expected to uphold these values.
          </p>

          <h3 className="mt-8 font-display text-xl font-semibold">Be respectful</h3>
          <p className="mt-2 leading-relaxed text-foreground/85">
            Treat every person you message or meet through Taba the way you would like
            to be treated. Listen actively, be open-minded, and make space for different
            perspectives.
          </p>

          <h3 className="mt-8 font-display text-xl font-semibold">Zero tolerance</h3>
          <p className="mt-2 leading-relaxed text-foreground/85">
            The following behaviour will result in immediate removal from Taba:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-foreground/85">
            <li>
              Racism, sexism, homophobia, transphobia, or any form of discrimination
            </li>
            <li>Sexual, inappropriate, or unwanted comments or advances</li>
            <li>Harassment, bullying, or intimidation</li>
            <li>Hate speech or derogatory language</li>
            <li>Sharing someone's private information without their consent</li>
          </ul>

          <h3 className="mt-8 font-display text-xl font-semibold">
            Keep it professional and kind
          </h3>
          <p className="mt-2 leading-relaxed text-foreground/85">
            Taba is not a dating platform. Conversations should remain professional,
            friendly, and focused on genuine connection. If someone expresses discomfort,
            respect their boundaries immediately.
          </p>

          <h3 className="mt-8 font-display text-xl font-semibold">Report concerns</h3>
          <p className="mt-2 leading-relaxed text-foreground/85">
            If you experience or witness behaviour that violates this code of conduct,
            please reach out to us at{" "}
            <a
              href="mailto:raquel.for.demo@outlook.com"
              className="font-medium text-primary underline underline-offset-4"
            >
              raquel.for.demo@outlook.com
            </a>
            . We take every report seriously and will act promptly.
          </p>

          <h2 className="mt-14 font-display text-2xl font-bold">Privacy</h2>
          <p className="mt-2 leading-relaxed text-foreground/85">
            Your data is stored securely. We only use your information to run Taba and
            the events you join. You can request deletion of your data at any time by
            contacting{" "}
            <a
              href="mailto:raquel.for.demo@outlook.com"
              className="font-medium text-primary underline underline-offset-4"
            >
              raquel.for.demo@outlook.com
            </a>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
