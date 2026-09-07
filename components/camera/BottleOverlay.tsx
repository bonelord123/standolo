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

  const smoothedBoxes = useRef<Box[]>([]);

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

  /*
   * A kamera object-cover módban jelenik meg.
   * Ezért először kiszámoljuk a ténylegesen kirajzolt
   * videó méretét és a levágás miatt keletkező eltolást.
   */

  const scale = Math.max(
    screenSize.width / videoWidth,
    screenSize.height / videoHeight
  );

  const renderedWidth = videoWidth * scale;
  const renderedHeight = videoHeight * scale;

  const offsetX =
    (screenSize.width - renderedWidth) / 2;

  const offsetY =
    (screenSize.height - renderedHeight) / 2;

  const currentBoxes: Box[] = detections
    .map((detection) => {
      const box = detection.boundingBox;

      if (!box) {
        return null;
      }

      return {
        left: box.originX * scale + offsetX,
        top: box.originY * scale + offsetY,
        width: box.width * scale,
        height: box.height * scale,
      };
    })
    .filter((box): box is Box => box !== null);

  /*
   * Egyszerű időbeli simítás.
   * Nem engedi, hogy a keret minden egyes AI-frame-re
   * azonnal nagyot ugorjon.
   */

  const smoothing = 0.35;

  const newSmoothedBoxes = currentBoxes.map(
    (box, index) => {
      const previous =
        smoothedBoxes.current[index];

      if (!previous) {
        return box;
      }

      return {
        left:
          previous.left +
          (box.left - previous.left) *
            smoothing,

        top:
          previous.top +
          (box.top - previous.top) *
            smoothing,

        width:
          previous.width +
          (box.width - previous.width) *
            smoothing,

        height:
          previous.height +
          (box.height - previous.height) *
            smoothing,
      };
    }
  );

  smoothedBoxes.current = newSmoothedBoxes;

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {newSmoothedBoxes.map((box, index) => {
        const detection = detections[index];

        const score =
          detection?.categories?.[0]?.score;

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
              {score
                ? ` ${Math.round(score * 100)}%`
                : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}