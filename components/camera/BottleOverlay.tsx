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

type Track = {
  id: number;
  box: Box;
  missingFrames: number;
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

  const tracks = useRef<Track[]>([]);
  const nextTrackId = useRef(1);

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

  const detectedBoxes: Box[] = detections
    .filter(
      (detection) =>
        detection.boundingBox !== undefined
    )
    .map((detection) => {
      const box = detection.boundingBox!;

      return {
        left: box.originX * scale - cropX,
        top: box.originY * scale - cropY,
        width: box.width * scale,
        height: box.height * scale,
      };
    });

  /*
   * Ha nincs palack, fokozatosan töröljük
   * a régi trackeket.
   */
  if (detectedBoxes.length === 0) {
    tracks.current = tracks.current.filter(
      (track) => {
        track.missingFrames += 1;
        return track.missingFrames < 10;
      }
    );
  } else {
    /*
     * Minden új detekciót megpróbálunk
     * a legközelebbi korábbi palackhoz kötni.
     */
    const usedTracks = new Set<number>();

    detectedBoxes.forEach((targetBox) => {
      const targetCenterX =
        targetBox.left +
        targetBox.width / 2;

      const targetCenterY =
        targetBox.top +
        targetBox.height / 2;

      let bestTrack: Track | null = null;
      let bestDistance = Infinity;

      tracks.current.forEach((track) => {
        if (usedTracks.has(track.id)) {
          return;
        }

        const trackCenterX =
          track.box.left +
          track.box.width / 2;

        const trackCenterY =
          track.box.top +
          track.box.height / 2;

        const dx =
          targetCenterX - trackCenterX;

        const dy =
          targetCenterY - trackCenterY;

        const distance = Math.sqrt(
          dx * dx + dy * dy
        );

        if (
          distance < bestDistance &&
          distance < 250
        ) {
          bestDistance = distance;
          bestTrack = track;
        }
      });

      if (bestTrack) {
        usedTracks.add(bestTrack.id);

        bestTrack.box = {
          left:
            bestTrack.box.left +
            (targetBox.left -
              bestTrack.box.left) *
              smoothing,

          top:
            bestTrack.box.top +
            (targetBox.top -
              bestTrack.box.top) *
              smoothing,

          width:
            bestTrack.box.width +
            (targetBox.width -
              bestTrack.box.width) *
              smoothing,

          height:
            bestTrack.box.height +
            (targetBox.height -
              bestTrack.box.height) *
              smoothing,
        };

        bestTrack.missingFrames = 0;
      } else {
        tracks.current.push({
          id: nextTrackId.current++,
          box: targetBox,
          missingFrames: 0,
        });
      }
    });

    /*
     * A régi, eltűnt trackeket eltávolítjuk.
     */
    tracks.current = tracks.current.filter(
      (track) => {
        if (!usedTracks.has(track.id)) {
          track.missingFrames += 1;
        }

        return track.missingFrames < 10;
      }
    );
  }

  /*
   * Csak az aktív palackokat rajzoljuk ki.
   */
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {tracks.current.map((track) => {
        const score = detections.find(
          (detection) => {
            if (!detection.boundingBox) {
              return false;
            }

            const box =
              detection.boundingBox;

            const left =
              box.originX * scale - cropX;

            const top =
              box.originY * scale - cropY;

            const centerX =
              left + box.width * scale / 2;

            const centerY =
              top + box.height * scale / 2;

            const trackCenterX =
              track.box.left +
              track.box.width / 2;

            const trackCenterY =
              track.box.top +
              track.box.height / 2;

            const dx =
              centerX - trackCenterX;

            const dy =
              centerY - trackCenterY;

            return (
              Math.sqrt(
                dx * dx + dy * dy
              ) < 100
            );
          }
        )?.categories?.[0]?.score;

        return (
          <div
            key={track.id}
            className="absolute rounded-lg border-4 border-green-400"
            style={{
              left: `${track.box.left}px`,
              top: `${track.box.top}px`,
              width: `${track.box.width}px`,
              height: `${track.box.height}px`,
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