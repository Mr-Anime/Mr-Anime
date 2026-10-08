import Link from "next/link";
import { siteConfig } from "@/lib/config";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/dmca", label: "DMCA / Contact" },
  { href: "/search", label: "Browse" },
  { href: "/docs/api", label: "API" },
  { href: "/account", label: "Account" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-lg font-bold tracking-tight">
              Mr<span className="text-sky-500">.</span>Anime
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {siteConfig.tagline}
            </p>
          </div>

          <nav
            className="flex flex-wrap gap-x-6 gap-y-2 text-sm"
            aria-label="Footer navigation"
          >
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="mailto:hello@mranime.example"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact
            </a>
          </nav>
        </div>

        <div className="space-y-1 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          <p>{siteConfig.attribution}</p>
          <p>
            © {new Date().getFullYear()} {siteConfig.author}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
