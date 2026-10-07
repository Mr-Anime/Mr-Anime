import type { Metadata } from "next";
import { CheckCircle2, DatabaseZap, GaugeIcon, MonitorPlayIcon } from "lucide-react";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "About",
  description: `About ${siteConfig.name} — what it is, how it works, and where the data comes from.`,
};

const features = [
  {
    icon: GaugeIcon,
    title: "Fast by default",
    text: "Server-cached metadata, streaming SSR and a lean client. Trending data refreshes hourly, details every 6 hours.",
  },
  {
    icon: MonitorPlayIcon,
    title: "Cinematic player",
    text: "A distraction-free 16:9 player with sandboxed provider embeds, next/prev navigation and an episode grid.",
  },
  {
    icon: DatabaseZap,
    title: "No anime database",
    text: "Every title, poster and episode list is fetched live from AniList and enriched with TMDB. Our database stores users only.",
  },
  {
    icon: CheckCircle2,
    title: "Accounts that stay out of the way",
    text: "Free accounts for suspensions, roles and an audit trail — no paywalls, no tracking pixels.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 px-4 py-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">About {siteConfig.name}</h1>
        <p className="text-muted-foreground">{siteConfig.tagline}</p>
      </header>

      <section className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          {siteConfig.name} is a modern anime catalogue and streaming front-end built
          for speed. Browse what&apos;s trending this season, dig through genre and
          year filters, open a title for full staff, character and relationship data,
          then jump straight into an episode.
        </p>
        <p>
          All anime metadata — titles, synopses, scores, episode counts, artwork — is
          fetched live from the{" "}
          <a
            href="https://anilist.co"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-500 underline-offset-4 hover:underline"
          >
            AniList
          </a>{" "}
          GraphQL API and enriched with{" "}
          <a
            href="https://www.themoviedb.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-500 underline-offset-4 hover:underline"
          >
            TMDB
          </a>{" "}
          where useful (backdrops, trailers, episode stills). Nothing about anime is
          stored in our own database — we only keep user accounts.
        </p>
        <p>
          Playback is provided by third-party embed sources listed on each watch
          page. If a source is down, use the <strong>Report</strong> button — reports
          go straight to the operators without needing an account.
        </p>
      </section>

      <section aria-label="Features" className="grid gap-4 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border border-border/60 bg-card p-5">
            <Icon className="mb-3 size-5 text-sky-500" aria-hidden />
            <h2 className="mb-1 text-sm font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-xl border border-border/60 bg-card p-6">
        <h2 className="text-lg font-semibold tracking-tight">Credits</h2>
        <p className="text-sm text-muted-foreground">
          Built and operated by {siteConfig.author}. {siteConfig.attribution}
        </p>
        <p className="text-sm text-muted-foreground">
          Questions, copyright notices or takedowns → see the{" "}
          <a href="/dmca" className="text-sky-500 underline-offset-4 hover:underline">
            DMCA / Contact page
          </a>
          .
        </p>
      </section>
    </div>
  );
}
