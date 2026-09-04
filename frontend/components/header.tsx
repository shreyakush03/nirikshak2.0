"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldAlert, Menu, X, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/95 border-b border-[#E5E5E5] transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Title */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF4F00] to-amber-500 flex items-center justify-center shadow-md shadow-[#FF4F00]/20 text-white shrink-0 group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-[#171717] font-poppins">
                IndiaMap • Nirikshak AI
              </span>
              <span className="hidden md:inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FF4F00]/10 text-[#FF4F00] border border-[#FF4F00]/20">
                Pan-India
              </span>
            </div>
            <span className="text-[10px] text-neutral-500 font-space-mono tracking-wide">
              NATIONAL MPLADS MONITORING
            </span>
          </div>
        </Link>

        {/* Center: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-neutral-600 font-nunito">
          <Link href="/" className="hover:text-[#FF4F00] transition-colors">
            Home
          </Link>
          <Link href="/#map" className="hover:text-[#FF4F00] transition-colors">
            Cities
          </Link>
          <Link href="/projects" className="hover:text-[#FF4F00] transition-colors">
            Explore Projects
          </Link>
          <Link href="/projects?tab=overview" className="hover:text-[#FF4F00] transition-colors">
            Analytics
          </Link>
        </nav>

        {/* Right: Primary Action Button */}
        <div className="flex items-center gap-2">
          <Link href="/projects">
            <Button size="sm" variant="default" className="shadow-md shadow-[#FF4F00]/20 font-nunito font-bold">
              Explore Projects
            </Button>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-[#F5F5F5] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 border-t border-[#E5E5E5] bg-white space-y-2 text-xs font-semibold text-neutral-700 font-nunito">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-[#F5F5F5]"
          >
            Home
          </Link>
          <Link
            href="/#map"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-[#F5F5F5]"
          >
            Cities
          </Link>
          <Link
            href="/projects"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-[#F5F5F5] text-[#FF4F00] font-bold"
          >
            Explore Projects
          </Link>
          <Link
            href="/projects?tab=overview"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg hover:bg-[#F5F5F5]"
          >
            Analytics & Overview
          </Link>
        </div>
      )}
    </header>
  );
}
