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
  const [screenSize, setScreenSize] = useState({
    width: 0,
    height: 0,
  });

  const stableBox = useRef<Box | null>(null);

  useEffect(() => {
    function updateSize() {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    updateSize();

    window.addEventListener("resize", updateSize);

    return () => {
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  if (
    !videoWidth ||
    !videoHeight ||
    !screenSize.width ||
    !screenSize.height
  ) {
    return null;
  }

  const scale = Math.max(
    screenSize.width / videoWidth,
    screenSize.height / videoHeight
  );

  const renderedWidth = videoWidth * scale;
  const renderedHeight = videoHeight * scale;

  const cropX =
    (renderedWidth - screenSize.width) / 2;

  const cropY =
    (renderedHeight - screenSize.height) / 2;

  const detection = detections[0];

  if (!detection?.boundingBox) {
    return null;
  }

  const box = detection.boundingBox;

  const targetBox: Box = {
    left: box.originX * scale - cropX,
    top: box.originY * scale - cropY,
    width: box.width * scale,
    height: box.height * scale,
  };

  /*
   * Erős stabilizálás.
   * Minél kisebb ez az érték, annál kevésbé ugrál.
   */
  const smoothing = 0.15;

  if (!stableBox.current) {
    stableBox.current = targetBox;
  } else {
    stableBox.current = {
      left:
        stableBox.current.left +
        (targetBox.left - stableBox.current.left) *
          smoothing,

      top:
        stableBox.current.top +
        (targetBox.top - stableBox.current.top) *
          smoothing,

      width:
        stableBox.current.width +
        (targetBox.width - stableBox.current.width) *
          smoothing,

      height:
        stableBox.current.height +
        (targetBox.height - stableBox.current.height) *
          smoothing,
    };
  }

  const stable = stableBox.current;

  const score =
    detection.categories?.[0]?.score;

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
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