"use client";

import { useState } from "react";

import CameraView from "@/components/camera/CameraView";
import BottleOverlay from "@/components/camera/BottleOverlay";

export default function Home() {
  const [cameraError, setCameraError] = useState("");

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      
      {/* Élő kamera */}
      <CameraView onError={setCameraError} />

      {/* Digitális standoló */}
      <BottleOverlay />

      {/* Felső információ */}
      <div className="absolute left-0 right-0 top-0 p-5 text-center text-white">
        <div className="rounded-2xl bg-black/50 px-4 py-3 backdrop-blur-sm">
          <p className="text-sm opacity-70">Palack</p>

          <p className="text-xl font-bold">
            Jägermeister 0,7 L
          </p>
        </div>
      </div>

      {/* Eredmény */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="rounded-2xl bg-black/70 px-8 py-4 text-center text-white backdrop-blur-sm">
          <p className="text-sm opacity-70">
            Folyadékszint
          </p>

          <p className="text-4xl font-bold">
            57%
          </p>
        </div>
      </div>

      {/* Kamera hiba */}
      {cameraError && (
        <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 rounded-2xl bg-red-600 p-5 text-center text-white">
          {cameraError}
        </div>
      )}
    </main>
  );
}