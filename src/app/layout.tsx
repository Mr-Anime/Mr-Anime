import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AdManager } from "@/components/ads/ad-manager";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PageVisitTracker } from "@/components/page-visit-tracker";
import { PwaRegister } from "@/components/pwa-register";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { siteConfig } from "@/lib/config";
import { shopFontVariables } from "@/lib/fonts";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Watch Anime Online`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "anime",
    "streaming",
    "watch anime",
    "anime episodes",
    "trending anime",
    "seasonal anime",
  ],
  authors: [{ name: siteConfig.author }],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: `${siteConfig.name} — Watch Anime Online`,
    description: siteConfig.description,
    url: siteConfig.url,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — Watch Anime Online`,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
  verification: {
    google: "SkUzXiwjmOq_XkrZi2-lFq52AakVg0PRESVYrGEkQW4",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Mr.Anime",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${shopFontVariables} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){try{var n=new Date(),y=n.getFullYear(),s=new Date(y,9,1),e=new Date(y,10,2);document.documentElement.classList.toggle("halloween",n>=s&&n<e);}catch(_){}})();',
          }}
        />
        <div className="halloween-decor" aria-hidden="true">
          <span className="halloween-bat halloween-bat-1" />
          <span className="halloween-bat halloween-bat-2" />
          <span className="halloween-bat halloween-bat-3" />
          <span className="halloween-bat halloween-bat-4" />
        </div>
        {/* Display fonts for shop name styles (link-loaded, CSP: fonts.googleapis.com) */}
        {/* eslint-disable @next/next/no-page-custom-font -- root layout = sitewide, app router */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Eagle+Lake&family=Isometra&family=New+Rocker&family=Rubik+Storm&family=Sancreek&display=swap"
          rel="stylesheet"
          precedence="shop-fonts"
        />
        {/* eslint-enable @next/next/no-page-custom-font */}
        <ThemeProvider>
          <TooltipProvider delay={300}>
            <QueryProvider>
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <AdManager />
              <SiteFooter />
              <Toaster position="bottom-right" closeButton richColors />
              <PwaRegister />
              <PageVisitTracker />
            </QueryProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
