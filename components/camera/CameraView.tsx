"use client";

import { useEffect, useRef, useState } from "react";
import {
  initializeBottleDetector,
  detectBottles,
} from "@/lib/vision/bottleDetector";

type CameraViewProps = {
  onError?: (message: string) => void;
};

export default function CameraView({ onError }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [status, setStatus] = useState("Kamera indítása...");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let running = true;

    async function startCamera() {
      try {
        setStatus("Kamera engedélyezése...");

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        const video = videoRef.current;

        if (!video) {
          throw new Error("A video elem nem található.");
        }

        video.srcObject = stream;

        await video.play();

        setStatus("Kamera működik – AI modell betöltése...");

        await initializeBottleDetector();

        setStatus("🟢 AI betöltve – palack keresése...");

        function detectFrame() {
          if (!running) {
            return;
          }

          if (video.readyState >= 2) {
            try {
              const timestamp = performance.now();

              const detections = detectBottles(video, timestamp);

              if (detections.length > 0) {
                setStatus(
                  `🟢 AI működik – ${detections.length} palack találva`
                );
              } else {
                setStatus(
                  "🟢 AI működik – nincs palack felismerve"
                );
              }
            } catch (error) {
              console.error("Detektálási hiba:", error);

              setStatus(
                "🔴 Hiba az AI detektálás közben"
              );
            }
          }

          animationFrameId = requestAnimationFrame(detectFrame);
        }

        detectFrame();
      } catch (error) {
        console.error("Kamera/AI hiba:", error);

        setStatus("🔴 Kamera vagy AI hiba");

        onError?.(
          "Nem sikerült elindítani a kamerát vagy az AI modellt."
        );
      }
    }

    startCamera();

    return () => {
      running = false;

      cancelAnimationFrame(animationFrameId);

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onError]);

  return (
    <div className="absolute inset-0">
      {/* Élő kamera */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* AI állapot */}
      <div className="absolute left-1/2 top-5 z-[100] -translate-x-1/2">
        <div className="rounded-2xl bg-red-600 px-6 py-4 text-center text-lg font-bold text-white">
          {status}
        </div>
      </div>
    </div>
  );
}