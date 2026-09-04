"use client";

import React, { useState } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";

export interface CityMarker {
  name: string;
  lat: number;
  lng: number;
  major?: boolean;
  state?: string;
  district?: string;
}

interface IndiaMapProps {
  cities?: CityMarker[];
  className?: string;
  onCitySelect?: (city: CityMarker) => void;
  onStateSelect?: (stateName: string) => void;
}

export const defaultCities: CityMarker[] = [
  { name: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { name: "Mohali", lat: 30.7046, lng: 76.7179 },
  { name: "Delhi NCR", lat: 28.6139, lng: 77.209, major: true },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { name: "Kanpur", lat: 26.4499, lng: 80.3319 },
  { name: "Lucknow", lat: 26.8467, lng: 80.9462 },
  { name: "Patna", lat: 25.5941, lng: 85.1376 },
  { name: "Guwahati", lat: 26.1445, lng: 91.7362 },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { name: "Indore", lat: 22.7196, lng: 75.8577 },
  { name: "Bhopal", lat: 23.2599, lng: 77.4126 },
  { name: "Surat", lat: 21.1702, lng: 72.8311 },
  { name: "Nagpur", lat: 21.1458, lng: 79.0882 },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639, major: true },
  { name: "Mumbai", lat: 19.076, lng: 72.8777, major: true },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
  { name: "Bhubaneswar", lat: 20.2961, lng: 85.8245 },
  { name: "Goa", lat: 15.2993, lng: 74.124 },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867, major: true },
  { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185 },
  { name: "Vijayawada", lat: 16.5062, lng: 80.648 },
  { name: "Tirupati", lat: 13.6288, lng: 79.4192 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946, major: true },
  { name: "Mysuru", lat: 12.2958, lng: 76.6394 },
  { name: "Coimbatore", lat: 11.0168, lng: 76.9558 },
  { name: "Kochi", lat: 9.9312, lng: 76.2673 },
  { name: "Chennai", lat: 13.0827, lng: 80.2707, major: true },
  { name: "Chandigarh", lat: 30.7333, lng: 76.7794, state: "Chandigarh", district: "Chandigarh" },
  { name: "Mohali", lat: 30.7046, lng: 76.7179, state: "Punjab", district: "Sahibzada Ajit Singh Nagar" },
  { name: "Delhi NCR", lat: 28.6139, lng: 77.209, major: true, state: "Delhi", district: "New Delhi" },
  { name: "Jaipur", lat: 26.9124, lng: 75.7873, state: "Rajasthan", district: "Jaipur" },
  { name: "Kanpur", lat: 26.4499, lng: 80.3319, state: "Uttar Pradesh", district: "Kanpur Nagar" },
  { name: "Lucknow", lat: 26.8467, lng: 80.9462, state: "Uttar Pradesh", district: "Lucknow" },
  { name: "Patna", lat: 25.5941, lng: 85.1376, state: "Bihar", district: "Patna" },
  { name: "Guwahati", lat: 26.1445, lng: 91.7362, state: "Assam", district: "Kamrup Metropolitan" },
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714, state: "Gujarat", district: "Ahmedabad" },
  { name: "Indore", lat: 22.7196, lng: 75.8577, state: "Madhya Pradesh", district: "Indore" },
  { name: "Bhopal", lat: 23.2599, lng: 77.4126, state: "Madhya Pradesh", district: "Bhopal" },
  { name: "Surat", lat: 21.1702, lng: 72.8311, state: "Gujarat", district: "Surat" },
  { name: "Nagpur", lat: 21.1458, lng: 79.0882, state: "Maharashtra", district: "Nagpur" },
  { name: "Kolkata", lat: 22.5726, lng: 88.3639, major: true, state: "West Bengal", district: "Kolkata" },
  { name: "Mumbai", lat: 19.076, lng: 72.8777, major: true, state: "Maharashtra", district: "Mumbai" },
  { name: "Pune", lat: 18.5204, lng: 73.8567, state: "Maharashtra", district: "Pune" },
  { name: "Bhubaneswar", lat: 20.2961, lng: 85.8245, state: "Odisha", district: "Khordha" },
  { name: "Goa", lat: 15.2993, lng: 74.124, state: "Goa", district: "North Goa" },
  { name: "Hyderabad", lat: 17.385, lng: 78.4867, major: true, state: "Telangana", district: "Hyderabad" },
  { name: "Visakhapatnam", lat: 17.6868, lng: 83.2185, state: "Andhra Pradesh", district: "Visakhapatnam" },
  { name: "Vijayawada", lat: 16.5062, lng: 80.648, state: "Andhra Pradesh", district: "NTR" },
  { name: "Tirupati", lat: 13.6288, lng: 79.4192, state: "Andhra Pradesh", district: "Tirupati" },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946, major: true, state: "Karnataka", district: "Bangalore Urban" },
  { name: "Mysuru", lat: 12.2958, lng: 76.6394, state: "Karnataka", district: "Mysuru" },
  { name: "Coimbatore", lat: 11.0168, lng: 76.9558, state: "Tamil Nadu", district: "Coimbatore" },
  { name: "Kochi", lat: 9.9312, lng: 76.2673, state: "Kerala", district: "Ernakulam" },
  { name: "Chennai", lat: 13.0827, lng: 80.2707, major: true, state: "Tamil Nadu", district: "Chennai" },
];

const TOPOJSON_URL = "/data/india-states.json";

export function IndiaMap({
  cities = defaultCities,
  className = "",
  onCitySelect
  onCitySelect,
  onStateSelect
}: IndiaMapProps) {
  const [hoveredCity, setHoveredCity] = useState<CityMarker | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  return (
    <div className={`w-full h-full relative select-none font-sans overflow-visible flex items-center justify-center ${className}`}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1100,
          center: [82.8, 22.0]
        }}
        className="w-full h-full max-h-[920px] drop-shadow-sm"
        viewBox="70 -10 670 770"
      >
        <defs>
          <filter id="map-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* State Geographies */}
        <Geographies geography={TOPOJSON_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: {
                    fill: "#dbeafe",
                    stroke: "#0ea5e9",
                    strokeWidth: 1.1,
                    outline: "none",
                    transition: "all 200ms ease",
                  },
                  hover: {
                    fill: "#bae6fd",
                    stroke: "#0284c7",
                    strokeWidth: 1.5,
                    outline: "none",
                    cursor: "pointer",
                  },
                  pressed: {
                    fill: "#93c5fd",
                    outline: "none",
                  },
                }}
              />
            ))
            geographies.map((geo) => {
              const stateName = geo.properties?.st_nm || geo.properties?.name || "";
              const isHovered = hoveredState === stateName;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => setHoveredState(stateName)}
                  onMouseLeave={() => setHoveredState(null)}
                  onClick={() => onStateSelect && stateName && onStateSelect(stateName)}
                  style={{
                    default: {
                      fill: isHovered ? "#bae6fd" : "#dbeafe",
                      stroke: "#0ea5e9",
                      strokeWidth: 1.1,
                      outline: "none",
                      transition: "all 200ms ease",
                    },
                    hover: {
                      fill: "#bae6fd",
                      stroke: "#0284c7",
                      strokeWidth: 1.6,
                      outline: "none",
                      cursor: "pointer",
                    },
                    pressed: {
                      fill: "#93c5fd",
                      outline: "none",
                    },
                  }}
                />
              );
            })
          }
        </Geographies>

        {/* City Markers with Radar Ping & Glow Labels */}
        {cities.map((city, idx) => {
          const isMajor = !!city.major;
          const dotRadius = isMajor ? 5 : 3.5;
          const pingRadius = isMajor ? 16 : 12;
          const isHovered = hoveredCity?.name === city.name;

          return (
            <Marker key={city.name} coordinates={[city.lng, city.lat]}>
              <g
                className="cursor-pointer"
                onMouseEnter={() => setHoveredCity(city)}
                onMouseLeave={() => setHoveredCity(null)}
                onClick={() => onCitySelect && onCitySelect(city)}
              >
                {/* Outer Pulsing Radar Ring */}
                <circle
                  cx={0}
                  cy={0}
                  r={dotRadius}
                  fill="#0ea5e9"
                  opacity={0.4}
                >
                  <animate
                    attributeName="r"
                    from={dotRadius}
                    to={pingRadius}
                    dur={`${2 + (idx % 3) * 0.4}s`}
                    begin={`${(idx % 5) * 0.3}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.7"
                    to="0"
                    dur={`${2 + (idx % 3) * 0.4}s`}
                    begin={`${(idx % 5) * 0.3}s`}
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Center Solid Dot */}
                <circle
                  cx={0}
                  cy={0}
                  r={isHovered ? dotRadius + 2 : dotRadius}
                  fill={isHovered ? "#FF4F00" : isMajor ? "#0284c7" : "#0ea5e9"}
                  stroke="#ffffff"
                  strokeWidth={isMajor ? 1.5 : 1}
                  filter="url(#map-glow)"
                  className="transition-transform duration-200"
                />

                {/* City Label */}
                <text
                  x={dotRadius + 6}
                  y={4}
                  className={`select-none pointer-events-none font-nunito ${
                    isMajor 
                      ? "fill-neutral-900 font-extrabold text-[13px]" 
                      : "fill-neutral-700 font-semibold text-[11px]"
                  }`}
                  style={{
                    textShadow: "0 1px 3px rgba(255,255,255,0.95), 0 0 2px rgba(255,255,255,0.9)"
                  }}
                >
                  {city.name}
                </text>
              </g>
            </Marker>
          );
        })}
      </ComposableMap>

      {/* Tooltip Bar */}
      <AnimatePresence>
        {hoveredCity && (
        {(hoveredCity || hoveredState) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 bg-white/95 text-[#171717] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg border border-[#E5E5E5] backdrop-blur-md flex items-center gap-2 font-nunito"
            className="absolute bottom-4 left-4 bg-white/95 text-[#171717] px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg border border-[#E5E5E5] backdrop-blur-md flex items-center gap-2.5 font-nunito"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF4F00]"></span>
            <span>{hoveredCity.name}</span>
            {hoveredCity.major && (
              <span className="text-[10px] uppercase font-bold text-[#0ea5e9] bg-sky-50 px-1.5 py-0.5 rounded font-space-mono">
                Major Hub
              </span>
            <span className="w-2 h-2 rounded-full bg-[#FF4F00] animate-pulse"></span>
            {hoveredCity ? (
              <>
                <span className="font-bold">{hoveredCity.name}</span>
                {hoveredCity.state && (
                  <span className="text-neutral-500 font-normal">({hoveredCity.state})</span>
                )}
                {hoveredCity.major && (
                  <span className="text-[10px] uppercase font-bold text-[#0ea5e9] bg-sky-50 px-1.5 py-0.5 rounded font-space-mono">
                    Major Hub
                  </span>
                )}
                <span className="text-[10px] text-neutral-400 pl-1 font-space-mono">Click to view projects</span>
              </>
            ) : (
              <>
                <span className="font-bold">{hoveredState}</span>
                <span className="text-[10px] text-neutral-400 pl-1 font-space-mono">Click to explore state projects</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
