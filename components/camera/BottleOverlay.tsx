"use client";

import { Detection } from "@mediapipe/tasks-vision";

type BottleOverlayProps = {
  detections: Detection[];
  videoWidth: number;
  videoHeight: number;
};

export default function BottleOverlay({
  detections,
  videoWidth,
  videoHeight,
}: BottleOverlayProps) {
  if (!videoWidth || !videoHeight) {
    return null;
  }

  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  const videoAspect = videoWidth / videoHeight;
  const screenAspect = screenWidth / screenHeight;

  let scale: number;
  let offsetX: number;
  let offsetY: number;

  if (screenAspect > videoAspect) {
    scale = screenWidth / videoWidth;

    const renderedHeight =
      videoHeight * scale;

    offsetX = 0;
    offsetY =
      (screenHeight - renderedHeight) / 2;
  } else {
    scale = screenHeight / videoHeight;

    const renderedWidth =
      videoWidth * scale;

    offsetX =
      (screenWidth - renderedWidth) / 2;

    offsetY = 0;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {detections.map((detection, index) => {
        const box = detection.boundingBox;

        if (!box) {
          return null;
        }

        const left =
          box.originX * scale + offsetX;

        const top =
          box.originY * scale + offsetY;

        const width =
          box.width * scale;

        const height =
          box.height * scale;

        const score =
          detection.categories?.[0]?.score;

        return (
          <div
            key={index}
            className="absolute rounded-lg border-4 border-green-400"
            style={{
              left,
              top,
              width,
              height,
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