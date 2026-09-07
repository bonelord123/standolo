"use client";

import {
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

import { Detection } from "@mediapipe/tasks-vision";

type BottleOverlayProps = {
  videoRef: RefObject<HTMLVideoElement | null>;
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

type OverlayBox = {
  box: Box;
  score?: number;
};

export default function BottleOverlay({
  videoRef,
  detections,
  videoWidth,
  videoHeight,
}: BottleOverlayProps) {
  const [videoRect, setVideoRect] =
    useState<DOMRect | null>(null);

  const stableBoxes =
    useRef<Box[]>([]);

  useEffect(() => {
    const updateRect = () => {
      const video = videoRef.current;

      if (!video) {
        return;
      }

      setVideoRect(
        video.getBoundingClientRect()
      );
    };

    updateRect();

    const interval = window.setInterval(
      updateRect,
      100
    );

    window.addEventListener(
      "resize",
      updateRect
    );

    window.addEventListener(
      "orientationchange",
      updateRect
    );

    return () => {
      window.clearInterval(interval);

      window.removeEventListener(
        "resize",
        updateRect
      );

      window.removeEventListener(
        "orientationchange",
        updateRect
      );
    };
  }, [videoRef]);

  if (
    !videoRect ||
    !videoWidth ||
    !videoHeight
  ) {
    return null;
  }

  const scaleX =
    videoRect.width / videoWidth;

  const scaleY =
    videoRect.height / videoHeight;

  const smoothing = 0.1;

  const boxes: OverlayBox[] = [];

  detections.forEach(
    (detection, index) => {
      if (!detection.boundingBox) {
        return;
      }

      const box = detection.boundingBox;

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

      const previousBox =
        stableBoxes.current[index];

      if (!previousBox) {
        stableBoxes.current[index] =
          targetBox;
      } else {
        stableBoxes.current[index] = {
          left:
            previousBox.left +
            (targetBox.left -
              previousBox.left) *
              smoothing,

          top:
            previousBox.top +
            (targetBox.top -
              previousBox.top) *
              smoothing,

          width:
            previousBox.width +
            (targetBox.width -
              previousBox.width) *
              smoothing,

          height:
            previousBox.height +
            (targetBox.height -
              previousBox.height) *
              smoothing,
        };
      }

      boxes.push({
        box: stableBoxes.current[index],
        score:
          detection.categories?.[0]?.score,
      });
    }
  );

  if (detections.length === 0) {
    stableBoxes.current = [];
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-30">
      {boxes.map((item, index) => {
        const { box, score } = item;

        return (
          <div
            key={index}
            className="absolute rounded-lg border-4 border-green-400"
            style={{
              left: `${box.left}px`,
              top: `${box.top}px`,
              width: `${box.width}px`,
              height: `${box.height}px`,
            }}
          >
            <div className="absolute -top-8 left-0 rounded-md bg-green-500 px-2 py-1 text-sm font-bold text-black">
              Palack
              {score !== undefined
                ? ` ${Math.round(
                    score * 100
                  )}%`
                : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}