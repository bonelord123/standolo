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

  // Ugyanaz az object-cover számítás,
  // amit a kamera megjelenítése használ.
  const scale = Math.max(
    screenWidth / videoWidth,
    screenHeight / videoHeight
  );

  const renderedWidth = videoWidth * scale;
  const renderedHeight = videoHeight * scale;

  const offsetX =
    (screenWidth - renderedWidth) / 2;

  const offsetY =
    (screenHeight - renderedHeight) / 2;

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
              left: `${left}px`,
              top: `${top}px`,
              width: `${width}px`,
              height: `${height}px`,
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