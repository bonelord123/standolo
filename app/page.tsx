"use client";

import { useCallback, useState } from "react";
import { Detection } from "@mediapipe/tasks-vision";

import CameraView from "@/components/camera/CameraView";
import BottleOverlay from "@/components/camera/BottleOverlay";

export default function Home() {
  const [cameraError, setCameraError] = useState("");

  const [detections, setDetections] = useState<Detection[]>([]);
  const [videoSize, setVideoSize] = useState({
    width: 0,
    height: 0,
  });

  const handleDetections = useCallback(
    (
      newDetections: Detection[],
      width: number,
      height: number
    ) => {
      setDetections(newDetections);

      setVideoSize({
        width,
        height,
      });
    },
    []
  );

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Kamera */}
      <div className="absolute inset-0 z-0">
        <CameraView
          onError={setCameraError}
          onDetections={handleDetections}
        />
      </div>

      {/* AI palackkeretek */}
      <BottleOverlay
        detections={detections}
        videoWidth={videoSize.width}
        videoHeight={videoSize.height}
      />

      {/* Kamera hiba */}
      {cameraError && (
        <div className="absolute inset-x-5 top-1/2 z-50 -translate-y-1/2 rounded-2xl bg-red-600 p-5 text-center text-white">
          {cameraError}
        </div>
      )}
    </main>
  );
}