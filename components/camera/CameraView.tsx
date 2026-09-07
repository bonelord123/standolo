"use client";
import {
  RefObject,
  useEffect,
  useState,
} from "react";

import { Detection } from "@mediapipe/tasks-vision";

import {
  initializeBottleDetector,
  detectBottles,
} from "@/lib/vision/bottleDetector";

type CameraViewProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
  onError?: (message: string) => void;
  onDetections?: (
    detections: Detection[],
    videoWidth: number,
    videoHeight: number
  ) => void;
};

export default function CameraView({
  videoRef,
  onError,
  onDetections,
}: CameraViewProps) {
  const [status, setStatus] = useState(
    "Kamera indítása..."
  );

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let running = true;

    async function startCamera() {
      try {
        setStatus("Kamera engedélyezése...");

        stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "environment" },
            },
            audio: false,
          });

        const video = videoRef.current;

        if (!video) {
          throw new Error(
            "A video elem nem található."
          );
        }

        video.srcObject = stream;

        await video.play();

        setStatus(
          "Kamera működik – AI modell betöltése..."
        );

        await initializeBottleDetector();

        setStatus("Palack keresése...");

        function detectFrame() {
          if (!running) {
            return;
          }

          const currentVideo =
            videoRef.current;

          if (!currentVideo) {
            animationFrameId =
              requestAnimationFrame(
                detectFrame
              );
            return;
          }

          if (
            currentVideo.readyState >= 2 &&
            currentVideo.videoWidth > 0 &&
            currentVideo.videoHeight > 0
          ) {
            try {
              const timestamp =
                performance.now();

              const detections =
                detectBottles(
                  currentVideo,
                  timestamp
                );

              onDetections?.(
                detections,
                currentVideo.videoWidth,
                currentVideo.videoHeight
              );

              if (detections.length > 0) {
                setStatus(
                  "1 palack találva"
                );
              } else {
                setStatus(
                  "Nincs palack felismerve"
                );
              }
            } catch (error) {
              console.error(
                "Detektálási hiba:",
                error
              );

              setStatus(
                "Hiba az AI detektálás közben"
              );
            }
          }

          animationFrameId =
            requestAnimationFrame(
              detectFrame
            );
        }

        detectFrame();
      } catch (error) {
        console.error(
          "Kamera/AI hiba:",
          error
        );

        setStatus(
          "Kamera vagy AI hiba"
        );

        onError?.(
          "Nem sikerült elindítani a kamerát vagy az AI modellt."
        );
      }
    }

    startCamera();

    return () => {
      running = false;

      cancelAnimationFrame(
        animationFrameId
      );

      if (stream) {
        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      }
    };
  }, [videoRef, onError, onDetections]);

  return (
    <div className="absolute inset-0">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute left-1/2 top-5 z-[100] -translate-x-1/2">
        <div className="rounded-2xl bg-red-600 px-6 py-4 text-center text-lg font-bold text-white">
          {status}
        </div>
      </div>
    </div>
  );
}
```
