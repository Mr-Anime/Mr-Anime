"use client";

import Link from "next/link";
import { Menu, X, Search, Bell, Play, ChevronRight, Clock, Calendar, Volume2, VolumeX, Users, Languages, Globe, Newspaper, Shuffle, User, ChevronLeft, ChevronRight, Star, Heart, Info, ExternalLink } from "lucide-react";

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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-[#2D2B45]/95 backdrop-blur-md py-2" : "bg-transparent py-4"}`.split("  ").join(" ")}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-[#7CE5D0] transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                <span className="text-[#7CE5D0]">YOUR</span>ANIME
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/watchtogether" className="nav-link text-sm font-medium text-white hover:text-[#7CE5D0] transition-colors">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Watch2gether</span>
                </div>
              </Link>

              <Link href="/random" className="nav-link text-sm font-medium text-white hover:text-[#7CE5D0] transition-colors">
                <div className="flex items-center gap-1">
                  <Shuffle className="h-4 w-4" />
                  <span>Random</span>
                </div>
              </Link>

              <div className="nav-link relative text-sm font-medium">
                <button className="flex items-center gap-1 text-white hover:text-[#7CE5D0] transition-colors">
                  <Languages className="h-4 w-4" />
                  <span>EN</span>
                </button>
              </div>

              <Link href="/news" className="nav-link text-sm font-medium text-white hover:text-[#7CE5D0] transition-colors">
                <div className="flex items-center gap-1">
                  <Newspaper className="h-4 w-4" />
                  <span>News</span>
                </div>
              </Link>

              <Link href="/community" className="nav-link text-sm font-medium text-white hover:text-[#7CE5D0] transition-colors">
                <div className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  <span>Community</span>
                </div>
              </Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/search" className="text-white hover:text-[#7CE5D0] transition-colors">
              <Search className="h-5 w-5" />
            </Link>

            <button className="text-white hover:text-[#7CE5D0] transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                3
              </span>
            </button>

            <Link href="/profile" className="text-white hover:text-[#7CE5D0] transition-colors">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-[#7CE5D0] to-[#55C7F0] flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white hover:text-[#7CE5D0] transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 bg-[#2D2B45] border-t border-[#35334D] md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <nav className="flex flex-col gap-4">
              <Link href="/watchtogether" className="nav-link text-sm font-medium text-white hover:text-[#7CE5D0] transition-colors">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Watch2gether</span>
                </div>
              </Link>

              <Link href="/random" className="nav-link text-sm font-medium text-white hover:text-[#7CE5D0] transition-colors">
                <div className="flex items-center gap-2">
                  <Shuffle className="h-4 w-4" />
                  <span>Random</span>
                </div>
              </Link>

              <div className="nav-link relative text-sm font-medium">
                <button className="flex items-center gap-2 w-full text-left text-white hover:text-[#7CE5D0] transition-colors">
                  <Languages className="h-4 w-4" />
                  <span>EN</span>
                </button>
              </div>

              <Link href="/news" className="nav-link text-sm font-medium text-white hover:text-[#7CE5D0] transition-colors">
                <div className="flex items-center gap-2">
                  <Newspaper className="h-4 w-4" />
                  <span>News</span>
                </div>
              </Link>

              <Link href="/community" className="nav-link text-sm font-medium text-white hover:text-[#7CE5D0] transition-colors">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span>Community</span>
                </div>
              </Link>

              <div className="flex gap-4 mt-4">
                <Link href="https://discord.com" className="text-white hover:text-[#7CE5D0] transition-colors">
                  <div className="h-8 w-8 rounded-full bg-[#2D2B45] border border-[#35334D] flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                </Link>

                <Link href="https://telegram.org" className="text-white hover:text-[#7CE5D0] transition-colors">
                  <div className="h-8 w-8 rounded-full bg-[#2D2B45] border border-[#35334D] flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                </Link>

                <Link href="https://instagram.com" className="text-white hover:text-[#7CE5D0] transition-colors">
                  <div className="h-8 w-8 rounded-full bg-[#2D2B45] border border-[#35334D] flex items-center justify-center">
                    <Users className="h-4 w-4" />
                  </div>
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
