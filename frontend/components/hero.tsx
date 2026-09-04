"use client";

import React from "react";
import { IndiaMap, defaultCities } from "@/components/ui/india-map";
import { Sparkles, MapPin, Layers, TrendingUp, ShieldCheck } from "lucide-react";

export function Hero() {
  return (
    <section id="hero" className="w-full relative py-16 md:py-24 overflow-hidden bg-[#FAFAFA] border-b border-[#E5E5E5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Top Centered Header & Tag */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF4F00]/10 border border-[#FF4F00]/20 text-[#FF4F00] text-xs font-semibold font-nunito">
            <Sparkles className="w-3.5 h-3.5 text-[#FF4F00]" />
            <span>Pan-India Presence & Unified Governance</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#171717] font-poppins tracking-tight leading-tight">
            From Kashmir to Kanyakumari —{" "}
            <span className="bg-gradient-to-r from-[#FF4F00] via-amber-500 to-[#22D3EE] bg-clip-text text-transparent">
              One Connected Network
            </span>
          </h1>

          <p className="text-neutral-600 text-sm sm:text-base font-normal max-w-2xl mx-auto leading-relaxed font-nunito">
            Real-time multi-signal intelligence covering all 36 States & Union Territories.
            Monitor fund flows, audit anomalies, detect duplicate projects, and track civic developments across India.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-semibold text-neutral-600 font-space-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22D3EE] animate-pulse"></span>
              28 States & 8 UTs
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF4F00]"></span>
              543+ Constituencies
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22C55E]"></span>
              ₹25,000+ Cr Monitored
            </span>
          </div>
        </div>

        {/* Animated Political India Map with Glowing City Markers */}
        <div id="map" className="relative max-w-4xl mx-auto aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] flex items-center justify-center">
          <IndiaMap cities={defaultCities} className="w-full h-full" />
        </div>

      </div>
    </section>
  );
}
