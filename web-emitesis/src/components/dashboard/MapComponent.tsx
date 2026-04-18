"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapComponentProps {
  center: { lat: number; lng: number };
  zoom?: number;
  points?: Array<{ lat: number; lng: number; label?: string }>;
  radiusM?: number; // Geocerca opcional
}

export default function MapComponent({ center, zoom = 14, points = [], radiusM }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([center.lat, center.lng], zoom);
    mapInstance.current = map;

    // Add tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update center, markers and circle
  useEffect(() => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;
    map.setView([center.lat, center.lng], zoom);

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add new markers
    points.forEach(p => {
      const marker = L.marker([p.lat, p.lng], { icon }).addTo(map);
      if (p.label) marker.bindPopup(p.label);
      markersRef.current.push(marker);
    });

    // Update Circle (Geofence)
    if (circleRef.current) circleRef.current.remove();
    if (radiusM) {
        circleRef.current = L.circle([center.lat, center.lng], {
          radius: radiusM,
          fillColor: "#003366",
          fillOpacity: 0.1,
          color: "#003366",
          weight: 1,
          dashArray: "5, 5",
        }).addTo(map);
    }
  }, [center, zoom, points, radiusM]);

  return (
    <div className="h-full w-full relative">
      <div ref={mapRef} className="h-full w-full z-10" />
      <div className="absolute top-4 right-4 z-20">
        <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-200 text-[10px] font-black uppercase tracking-widest text-[#003366] shadow-lg">
          Localización Activa
        </div>
      </div>
    </div>
  );
}
