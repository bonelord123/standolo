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
          throw new Error("A kamera video elem nem található.");
        }

        video.srcObject = stream;

        await video.play();

        setStatus("AI modell betöltése...");

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
                  `🟢 Palack találva: ${detections.length} db`
                );
              } else {
                setStatus("🟢 AI működik – nincs palack felismerve");
              }
            } catch (error) {
              console.error("Detektálási hiba:", error);
              setStatus("🔴 Hiba az AI detektálás közben");
            }
          }

          animationFrameId = requestAnimationFrame(detectFrame);
        }

        detectFrame();
      } catch (error) {
        console.error(error);

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
      {/* Kamera */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* AI állapot */}
      <div className="absolute left-1/2 top-5 z-50 -translate-x-1/2">
        <div className="rounded-2xl bg-black/75 px-5 py-3 text-center text-sm font-semibold text-white backdrop-blur-sm">
          {status}
        </div>
      </div>
    </div>
  );
}