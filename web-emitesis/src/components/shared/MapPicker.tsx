"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-3">
      <Loader2 className="w-8 h-8 text-[#003366] animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando mapa...</p>
    </div>
  ),
});

interface MapPickerProps {
  lat: number;
  lng: number;
  radiusM?: number;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker(props: MapPickerProps) {
  return <LeafletMap {...props} />;
}
