import {
  Bangers,
  Bebas_Neue,
  Caveat,
  Dancing_Script,
  Creepster,
  Lobster,
  Playfair_Display,
  Quicksand,
  Rajdhani,
  Space_Grotesk,
} from "next/font/google";

/** Distinct typefaces for the shop's name-style cosmetics (Mr.Coin shop). */

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-shop-rajdhani",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-shop-quicksand",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-shop-playfair",
  display: "swap",
});

const dancing = Dancing_Script({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-shop-dancing",
  display: "swap",
});

const lobster = Lobster({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-shop-lobster",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-shop-space-grotesk",
  display: "swap",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-shop-bebas",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-shop-caveat",
  display: "swap",
});

const creepster = Creepster({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-shop-creepster",
  display: "swap",
});

const bangers = Bangers({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-shop-bangers",
  display: "swap",
});

/** CSS-variable classes for <html> so .shop-style-* can use the fonts. */
export const shopFontVariables = [
  rajdhani.variable,
  quicksand.variable,
  playfair.variable,
  dancing.variable,
  lobster.variable,
  spaceGrotesk.variable,
  bebas.variable,
  caveat.variable,
  creepster.variable,
  bangers.variable,
].join(" ");
