"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Search,
  Bell,
  Play,
  Shuffle,
  User,
  ShoppingBag,
  MessageSquare,
  Sparkles,
} from "lucide-react";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#161527]/95 backdrop-blur-md border-b border-white/10 py-2.5 shadow-xl"
          : "bg-gradient-to-b from-[#161527]/90 to-transparent py-4"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Left section: Hamburger & Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-300 hover:text-[#7CE5D0] transition-colors md:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7CE5D0] to-[#55C7F0] text-[#161527] shadow-lg shadow-[#7CE5D0]/30 transition-transform duration-300 group-hover:scale-110">
                <Play className="h-5 w-5 fill-current ml-0.5" />
              </div>
              <span className="text-xl font-black tracking-wider text-white">
                MR.<span className="text-[#7CE5D0]">ANIME</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-bold">
              <Link
                href="/search?sort=TRENDING_DESC"
                className="text-slate-300 hover:text-[#7CE5D0] transition-colors flex items-center gap-1.5"
              >
                <span>Trending</span>
              </Link>

              <Link
                href="/search"
                className="text-slate-300 hover:text-[#7CE5D0] transition-colors flex items-center gap-1.5"
              >
                <span>Browse</span>
              </Link>

              <Link
                href="/forum"
                className="text-slate-300 hover:text-[#7CE5D0] transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="h-4 w-4 text-[#7CE5D0]" />
                <span>Forum</span>
              </Link>

              <Link
                href="/shop"
                className="text-slate-300 hover:text-[#7CE5D0] transition-colors flex items-center gap-1.5"
              >
                <ShoppingBag className="h-4 w-4 text-[#55C7F0]" />
                <span>Shop</span>
              </Link>

              <Link
                href="/leaderboard"
                className="text-slate-300 hover:text-[#7CE5D0] transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                <span>Leaderboard</span>
              </Link>
            </nav>
          </div>

          {/* Right section: Search & User Controls */}
          <div className="flex items-center gap-4">
            <Link
              href="/search"
              className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur-md transition-all hover:bg-white/20 hover:text-white"
            >
              <Search className="h-4 w-4 text-[#7CE5D0]" />
              <span className="hidden sm:inline">Search anime...</span>
            </Link>

            <Link
              href="/account"
              className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#7CE5D0] to-[#55C7F0] p-0.5 shadow-md transition-transform hover:scale-105"
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#161527] text-[#7CE5D0] transition-colors group-hover:bg-transparent group-hover:text-[#161527]">
                <User className="h-4 w-4" />
              </div>
            </Link>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="hidden md:inline-flex text-slate-300 hover:text-[#7CE5D0] transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="absolute left-0 right-0 bg-[#161527] border-b border-white/10 md:hidden shadow-2xl">
          <div className="mx-auto max-w-7xl px-4 py-5 space-y-4 font-bold text-sm">
            <nav className="flex flex-col gap-3">
              <Link
                href="/search?sort=TRENDING_DESC"
                onClick={() => setIsOpen(false)}
                className="text-slate-200 hover:text-[#7CE5D0] transition-colors"
              >
                🔥 Trending
              </Link>

              <Link
                href="/search"
                onClick={() => setIsOpen(false)}
                className="text-slate-200 hover:text-[#7CE5D0] transition-colors"
              >
                🔍 Browse All Anime
              </Link>

              <Link
                href="/forum"
                onClick={() => setIsOpen(false)}
                className="text-slate-200 hover:text-[#7CE5D0] transition-colors"
              >
                💬 Community Forum
              </Link>

              <Link
                href="/shop"
                onClick={() => setIsOpen(false)}
                className="text-slate-200 hover:text-[#7CE5D0] transition-colors"
              >
                🛍️ Item Shop
              </Link>

              <Link
                href="/account"
                onClick={() => setIsOpen(false)}
                className="text-slate-200 hover:text-[#7CE5D0] transition-colors"
              >
                👤 My Account
              </Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
