"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "./layout/navbar";
import { HeroBanner } from "./anime/hero-banner";
import { TrendingSection } from "./anime/trending-section";
import { ScrollToTopButton } from "./ui/scroll-to-top-button";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans bg-[#1F1E32] text-white antialiased`}
      >
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
