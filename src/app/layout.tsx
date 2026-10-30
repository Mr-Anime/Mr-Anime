import type { ReactNode } from "react";

import { Navbar } from "../components/layout/navbar";
import { ScrollToTopButton } from "../components/ui/scroll-to-top-button";

import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-[#1F1E32] text-white antialiased pt-16">
        <Navbar />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>

        <ScrollToTopButton />
      </body>
    </html>
  );
}