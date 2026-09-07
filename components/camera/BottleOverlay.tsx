"use client";

import { useEffect, useRef, useState } from "react";
import { Detection } from "@mediapipe/tasks-vision";

type BottleOverlayProps = {
  detections: Detection[];
  videoWidth: number;
  videoHeight: number;
};

type Box = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export default function BottleOverlay({
  detections,
  videoWidth,
  videoHeight,
}: BottleOverlayProps) {
  const [videoRect, setVideoRect] =
    useState<DOMRect | null>(null);

  const stableBox = useRef<Box | null>(null);

  useEffect(() => {
    const videoElement =
  document.querySelector("video") as HTMLVideoElement | null;

if (!videoElement) {
  return;
}

    function updateRect() {
      setVideoRect(
        videoElement.getBoundingClientRect()
      );
    }

    updateRect();

    window.addEventListener(
      "resize",
      updateRect
    );

    window.addEventListener(
      "orientationchange",
      updateRect
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateRect
      );

      window.removeEventListener(
        "orientationchange",
        updateRect
      );
    };
  }, []);

  if (
    !videoRect ||
    !videoWidth ||
    !videoHeight
  ) {
    return null;
  }

  const detection = detections[0];

  if (!detection?.boundingBox) {
    return null;
  }

  const box = detection.boundingBox;

  const scaleX =
    videoRect.width / videoWidth;

  const scaleY =
    videoRect.height / videoHeight;

  const targetBox: Box = {
    left:
      videoRect.left +
      box.originX * scaleX,

    top:
      videoRect.top +
      box.originY * scaleY,

    width:
      box.width * scaleX,

    height:
      box.height * scaleY,
  };

  const smoothing = 0.12;

  if (!stableBox.current) {
    stableBox.current = targetBox;
  } else {
    stableBox.current = {
      left:
        stableBox.current.left +
        (targetBox.left -
          stableBox.current.left) *
          smoothing,

      top:
        stableBox.current.top +
        (targetBox.top -
          stableBox.current.top) *
          smoothing,

      width:
        stableBox.current.width +
        (targetBox.width -
          stableBox.current.width) *
          smoothing,

      height:
        stableBox.current.height +
        (targetBox.height -
          stableBox.current.height) *
          smoothing,
    };
  }

  const stable = stableBox.current;

  const score =
    detection.categories?.[0]?.score;

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      <div
        className="absolute rounded-lg border-4 border-green-400"
        style={{
          left: `${stable.left}px`,
          top: `${stable.top}px`,
          width: `${stable.width}px`,
          height: `${stable.height}px`,
        }}
      >
        <div className="absolute -top-8 left-0 rounded-md bg-green-500 px-2 py-1 text-sm font-bold text-black">
          Palack
          {score
            ? ` ${Math.round(score * 100)}%`
            : ""}
        </div>
      </div>
    </div>
  );
}