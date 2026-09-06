"use client";

import { useEffect, useRef } from "react";
import {
  initializeBottleDetector,
  detectBottles,
} from "@/lib/vision/bottleDetector";

type CameraViewProps = {
  onError?: (message: string) => void;
};

export default function CameraView({ onError }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        const video = videoRef.current;

        if (!video) {
          return;
        }

        video.srcObject = stream;

        await video.play();

        // AI modell betöltése
        await initializeBottleDetector();

        // Élő kamerakép folyamatos elemzése
        function detectFrame() {
          if (video.readyState >= 2) {
            const timestamp = performance.now();

            const detections = detectBottles(video, timestamp);

            console.log("Palackok:", detections);
          }

          animationFrameId = requestAnimationFrame(detectFrame);
        }

        detectFrame();
      } catch (error) {
        console.error(error);

        onError?.(
          "Nem sikerült elindítani a kamerát vagy az AI modellt."
        );
      }
    }

    startCamera();

    return () => {
      cancelAnimationFrame(animationFrameId);

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onError]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}