import type { ReactNode } from "react";

import { Navbar } from "../components/layout/navbar";
import { HeroBanner } from "../components/anime/hero-banner";
import { TrendingSection } from "../components/anime/trending-section";
import { ScrollToTopButton } from "../components/ui/scroll-to-top-button";

import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-[#1F1E32] text-white antialiased">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="space-y-12">
            <HeroBanner />
            <TrendingSection />
            {children}
          </div>
        </main>

        <ScrollToTopButton />
      </body>
    </html>
  );
}