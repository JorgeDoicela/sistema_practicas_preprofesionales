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

interface LeafletMapProps {
  lat: number;
  lng: number;
  radiusM?: number;
  onChange: (lat: number, lng: number) => void;
}

export default function LeafletMap({ lat, lng, radiusM = 200, onChange }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerInstance = useRef<L.Marker | null>(null);
  const circleInstance = useRef<L.Circle | null>(null);

  const initialLatRef = useRef(lat);
  const initialLngRef = useRef(lng);
  const initialRadiusRef = useRef(radiusM);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const center: [number, number] = [initialLatRef.current || -0.180653, initialLngRef.current || -78.467838];
    
    // Initialize map
    const map = L.map(mapRef.current).setView(center, 16);
    mapInstance.current = map;

    // Add tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Initial Marker
    markerInstance.current = L.marker(center, { icon }).addTo(map);

    // Initial Circle
    if (initialRadiusRef.current > 0) {
      circleInstance.current = L.circle(center, {
        radius: initialRadiusRef.current,
        fillColor: "#003366",
        fillOpacity: 0.1,
        color: "#003366",
        weight: 1,
        dashArray: "5, 5",
      }).addTo(map);
    }

    // Click event
    map.on("click", (e) => {
      onChangeRef.current(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []); // Only once on mount

  // Sync state to map
  useEffect(() => {
    if (!mapInstance.current) return;
    const center: [number, number] = [lat, lng];
    
    // Update marker
    if (markerInstance.current) {
      markerInstance.current.setLatLng(center);
    }
    
    // Update circle
    if (circleInstance.current) {
      circleInstance.current.setLatLng(center);
      circleInstance.current.setRadius(radiusM);
    }

    // Center view if requested (optional, maybe only if manually changed inputs)
    // mapInstance.current.panTo(center);
  }, [lat, lng, radiusM]);

  return (
    <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner group relative">
      <div ref={mapRef} className="h-full w-full z-10" />
      <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-3 py-1.5 border-t border-slate-200 text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between z-20">
        <span>Click en el mapa para ubicar la sede</span>
        <span className="text-blue-600">Sede actual: {lat.toFixed(6)}, {lng.toFixed(6)}</span>
      </div>
    </div>
  );
}
