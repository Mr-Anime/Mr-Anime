import Link from "next/link";
import { SearchIcon } from "lucide-react";
import { UserMenu } from "./user-menu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Browse" },
  { href: "/search?sort=TRENDING_DESC", label: "Trending" },
  { href: "/list", label: "My List" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4">
        <Link
          href="/"
          className="shrink-0 text-lg font-bold tracking-tight no-tap-highlight"
          aria-label="Mr.Anime home"
        >
          Mr<span className="text-sky-500">.</span>Anime
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ButtonLink href="/search" label="Search">
            <SearchIcon className="size-4" />
          </ButtonLink>
          <UserMenu />
        </div>
      </div>

      <nav
        className="flex gap-1 overflow-x-auto border-t border-border/60 px-4 py-2 scrollbar-none md:hidden"
        aria-label="Mobile navigation"
      >
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 rounded-full px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function ButtonLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Link>
  );
}
