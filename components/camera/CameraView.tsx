"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("TESZT: CameraView betöltve");

  useEffect(() => {
    setStatus("TESZT: useEffect működik");

    async function startCamera() {
      try {
        setStatus("TESZT: kamera indítása...");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        if (!videoRef.current) {
          setStatus("TESZT: video elem hiányzik");
          return;
        }

        videoRef.current.srcObject = stream;

        await videoRef.current.play();

        setStatus("TESZT: KAMERA MŰKÖDIK");
      } catch (error) {
        console.error(error);
        setStatus("TESZT: KAMERA HIBA");
      }
    }

    startCamera();
  }, []);

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