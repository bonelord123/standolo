"use client";

import { useState } from "react";

import CameraView from "@/components/camera/CameraView";
import BottleOverlay from "@/components/camera/BottleOverlay";

export default function Home() {
  const [cameraError, setCameraError] = useState("");

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">

      {/* Kamera réteg */}
      <div className="absolute inset-0 z-0">
        <CameraView onError={setCameraError} />
      </div>

      {/* Minden, ami a kamera fölött jelenik meg */}
      <BottleOverlay />

      {/* Kamera hiba */}
      {cameraError && (
        <div className="absolute inset-x-5 top-1/2 z-50 -translate-y-1/2 rounded-2xl bg-red-600 p-5 text-center text-white">
          {cameraError}
        </div>
      )}

    </main>
  );
}