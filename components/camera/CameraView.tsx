"use client";

import { useEffect, useRef, useState } from "react";
import {
  initializeBottleDetector,
  detectBottles,
} from "@/lib/vision/bottleDetector";

type CameraViewProps = {
  onError?: (message: string) => void;
};

type DetectedBottle = {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
};

export default function CameraView({ onError }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [bottles, setBottles] = useState<DetectedBottle[]>([]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let running = true;

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

        // Élő kamerakép elemzése
        function detectFrame() {
          if (!running) {
            return;
          }

          if (video.readyState >= 2) {
            const timestamp = performance.now();

            const detections = detectBottles(video, timestamp);

            const detectedBottles: DetectedBottle[] = detections
              .map((detection) => {
                const box = detection.boundingBox;
                const category = detection.categories?.[0];

                if (!box || !category) {
                  return null;
                }

                return {
                  x: box.originX,
                  y: box.originY,
                  width: box.width,
                  height: box.height,
                  score: category.score,
                };
              })
              .filter(
                (bottle): bottle is DetectedBottle => bottle !== null
              );

            setBottles(detectedBottles);
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

      {/* AI detekciók */}
      <div className="absolute inset-0 z-10">
        {bottles.map((bottle, index) => (
          <div
            key={index}
            className="absolute border-4 border-green-400"
            style={{
              left: `${(bottle.x / (videoRef.current?.videoWidth || 1)) * 100}%`,
              top: `${(bottle.y / (videoRef.current?.videoHeight || 1)) * 100}%`,
              width: `${(bottle.width / (videoRef.current?.videoWidth || 1)) * 100}%`,
              height: `${(bottle.height / (videoRef.current?.videoHeight || 1)) * 100}%`,
            }}
          >
            <div className="absolute -top-8 left-0 whitespace-nowrap rounded bg-green-400 px-2 py-1 text-sm font-bold text-black">
              🍾 Bottle {Math.round(bottle.score * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}