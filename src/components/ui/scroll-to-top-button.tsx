"use client";

import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed right-6 bottom-6 z-50 h-12 w-12 rounded-full bg-[#35334D] border border-[#7CE5D0]/30 text-white shadow-lg transition-all duration-300 hover:bg-[#7CE5D0]/20 ${isVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`.split("  ").join(" ")}
    >
      <ChevronUp className="h-5 w-5 mx-auto" />
    </button>
  );
}
