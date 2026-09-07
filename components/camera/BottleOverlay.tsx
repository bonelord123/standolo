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

  const stableBoxes = useRef<Box[]>([]);

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

  const smoothing = 0.15;

  const boxes: {
    box: Box;
    score?: number;
  }[] = [];

  detections.forEach((detection, index) => {
    if (!detection.boundingBox) {
      return;
    }

    const box = detection.boundingBox;

    const targetBox: Box = {
      left: box.originX * scale - cropX,
      top: box.originY * scale - cropY,
      width: box.width * scale,
      height: box.height * scale,
    };

    const previousBox =
      stableBoxes.current[index];

    if (!previousBox) {
      stableBoxes.current[index] = targetBox;
    } else {
      stableBoxes.current[index] = {
        left:
          previousBox.left +
          (targetBox.left - previousBox.left) *
            smoothing,

        top:
          previousBox.top +
          (targetBox.top - previousBox.top) *
            smoothing,

        width:
          previousBox.width +
          (targetBox.width - previousBox.width) *
            smoothing,

        height:
          previousBox.height +
          (targetBox.height - previousBox.height) *
            smoothing,
      };
    }

    boxes.push({
      box: stableBoxes.current[index],
      score:
        detection.categories?.[0]?.score,
    });
  });

  if (detections.length === 0) {
    stableBoxes.current = [];
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
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