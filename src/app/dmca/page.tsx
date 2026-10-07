import type { Metadata } from "next";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "DMCA / Contact",
  description: `Copyright takedown requests and contact information for ${siteConfig.name}.`,
};

const steps = [
  {
    title: "Identify the work",
    description:
      "Tell us the exact anime title and the page URL you believe infringes your copyright.",
  },
  {
    title: "Send your notice",
    description:
      "Email dmca@mranime.example with your identification, a good-faith statement, your signature, and the requested removal.",
  },
  {
    title: "We review",
    description:
      "We review complete notices promptly and remove or disable access to the identified material when warranted.",
  },
  {
    title: "Counter-notice",
    description:
      "If you believe your content was removed in error, reply with a counter-notice including the required statements.",
  },
];

export default function DmcaPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">DMCA / Copyright</h1>
        <p className="text-muted-foreground">
          {siteConfig.name} respects intellectual property rights. We respond to
          complete takedown notices under the Digital Millennium Copyright Act.
        </p>
      </header>

      <section aria-label="How to file a notice" className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">How to file a notice</h2>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-xl border border-border/60 bg-card p-4"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-500/15 text-sm font-semibold text-sky-500">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">What to include</h2>
        <ul className="list-disc space-y-1.5 pl-6 text-sm text-muted-foreground">
          <li>Your physical or electronic signature</li>
          <li>Identification of the copyrighted work claimed to be infringed</li>
          <li>Identification of the infringing material and its URL on this site</li>
          <li>Your contact information (address, phone, email)</li>
          <li>
            A statement of good faith that the use is not authorized by you or your
            agent
          </li>
          <li>
            A statement, under penalty of perjury, that the information is accurate
            and you are the rights holder or authorized to act on their behalf
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Contact</h2>
        <div className="rounded-xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
          <p>
            DMCA notices:{" "}
            <a
              href="mailto:dmca@mranime.example"
              className="text-sky-500 underline-offset-4 hover:underline"
            >
              dmca@mranime.example
            </a>
          </p>
          <p className="mt-1">
            General contact:{" "}
            <a
              href="mailto:hello@mranime.example"
              className="text-sky-500 underline-offset-4 hover:underline"
            >
              hello@mranime.example
            </a>
          </p>
          <p className="mt-1">
            Operators: {siteConfig.author}. This site does not host any video files
            itself — playback is embedded from third-party sources.
          </p>
        </div>
      </section>
    </div>
  );
}
