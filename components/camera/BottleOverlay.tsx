"use client";

import {
useEffect,
useRef,
useState,
type RefObject,
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

type Track = {
box: Box;
missingFrames: number;
level: number;
};

export default function BottleOverlay({
videoRef,
detections,
videoWidth,
videoHeight,
}: BottleOverlayProps) {
const [screenSize, setScreenSize] = useState({
width: 0,
height: 0,
});

const tracks = useRef<Track[]>([]);
const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
const levelSmoothing = 0.2;
const maxTrackingDistance = 300;

const detectedBoxes: {
box: Box;
score?: number;
}[] = [];

detections.forEach((detection) => {
if (!detection.boundingBox) {
return;
}

const box = detection.boundingBox;

detectedBoxes.push({
  box: {
    left: box.originX * scale - cropX,
    top: box.originY * scale - cropY,
    width: box.width * scale,
    height: box.height * scale,
  },
  score: detection.categories?.[0]?.score,
});

});

function estimateLiquidLevel(box: Box): number {
const video = videoRef.current;

if (!video || video.videoWidth === 0) {
  return 50;
}

if (!canvasRef.current) {
  canvasRef.current = document.createElement("canvas");
}

const canvas = canvasRef.current;
const context = canvas.getContext("2d", {
  willReadFrequently: true,
});

if (!context) {
  return 50;
}

const sourceLeft =
  (box.left + cropX) / scale;

const sourceTop =
  (box.top + cropY) / scale;

const sourceWidth =
  box.width / scale;

const sourceHeight =
  box.height / scale;

const sampleWidth = 80;
const sampleHeight = 120;

canvas.width = sampleWidth;
canvas.height = sampleHeight;

context.drawImage(
  video,
  sourceLeft,
  sourceTop,
  sourceWidth,
  sourceHeight,
  0,
  0,
  sampleWidth,
  sampleHeight
);

const imageData = context.getImageData(
  0,
  0,
  sampleWidth,
  sampleHeight
);

const pixels = imageData.data;

let bestY = -1;
let bestScore = 0;

for (
  let y = 10;
  y < sampleHeight - 10;
  y++
) {
  let difference = 0;
  let samples = 0;

  for (
    let x = 15;
    x < sampleWidth - 15;
    x += 4
  ) {
    const currentIndex =
      (y * sampleWidth + x) * 4;

    const previousIndex =
      ((y - 2) * sampleWidth + x) * 4;

    const currentR =
      pixels[currentIndex];

    const currentG =
      pixels[currentIndex + 1];

    const currentB =
      pixels[currentIndex + 2];

    const previousR =
      pixels[previousIndex];

    const previousG =
      pixels[previousIndex + 1];

    const previousB =
      pixels[previousIndex + 2];

    const currentBrightness =
      (currentR +
        currentG +
        currentB) /
      3;

    const previousBrightness =
      (previousR +
        previousG +
        previousB) /
      3;

    difference += Math.abs(
      currentBrightness -
        previousBrightness
    );

    samples += 1;
  }

  const score =
    samples > 0
      ? difference / samples
      : 0;

  if (score > bestScore) {
    bestScore = score;
    bestY = y;
  }
}

if (bestY === -1 || bestScore < 5) {
  return 50;
}

const relativeY =
  bestY / sampleHeight;

let level =
  (1 - relativeY) * 100;

level = Math.max(
  0,
  Math.min(100, level)
);

return Math.round(level);

}

if (detectedBoxes.length === 0) {
tracks.current = [];
} else {
const usedTracks = new Set<number>();

const matches: {
  detectionIndex: number;
  trackIndex: number;
  distance: number;
}[] = [];

detectedBoxes.forEach(
  (detected, detectionIndex) => {
    const detectedCenterX =
      detected.box.left +
      detected.box.width / 2;

    const detectedCenterY =
      detected.box.top +
      detected.box.height / 2;

    tracks.current.forEach(
      (track, trackIndex) => {
        const trackCenterX =
          track.box.left +
          track.box.width / 2;

        const trackCenterY =
          track.box.top +
          track.box.height / 2;

        const dx =
          detectedCenterX -
          trackCenterX;

        const dy =
          detectedCenterY -
          trackCenterY;

        const distance = Math.sqrt(
          dx * dx + dy * dy
        );

        if (
          distance <=
          maxTrackingDistance
        ) {
          matches.push({
            detectionIndex,
            trackIndex,
            distance,
          });
        }
      }
    );
  }
);

matches.sort(
  (a, b) => a.distance - b.distance
);

const matchedDetections =
  new Set<number>();

matches.forEach((match) => {
  if (
    matchedDetections.has(
      match.detectionIndex
    )
  ) {
    return;
  }

  if (
    usedTracks.has(
      match.trackIndex
    )
  ) {
    return;
  }

  const detected =
    detectedBoxes[
      match.detectionIndex
    ];

  const track =
    tracks.current[
      match.trackIndex
    ];

  const measuredLevel =
    estimateLiquidLevel(
      detected.box
    );

  track.box = {
    left:
      track.box.left +
      (detected.box.left -
        track.box.left) *
        smoothing,

    top:
      track.box.top +
      (detected.box.top -
        track.box.top) *
        smoothing,

    width:
      track.box.width +
      (detected.box.width -
        track.box.width) *
        smoothing,

    height:
      track.box.height +
      (detected.box.height -
        track.box.height) *
        smoothing,
  };

  track.level =
    track.level +
    (measuredLevel -
      track.level) *
      levelSmoothing;

  track.missingFrames = 0;

  usedTracks.add(
    match.trackIndex
  );

  matchedDetections.add(
    match.detectionIndex
  );
});

detectedBoxes.forEach(
  (detected, detectionIndex) => {
    if (
      matchedDetections.has(
        detectionIndex
      )
    ) {
      return;
    }

    const measuredLevel =
      estimateLiquidLevel(
        detected.box
      );

    tracks.current.push({
      box: detected.box,
      missingFrames: 0,
      level: measuredLevel,
    });
  }
);

tracks.current.forEach(
  (track, trackIndex) => {
    if (
      !usedTracks.has(trackIndex)
    ) {
      track.missingFrames += 1;
    }
  }
);

tracks.current =
  tracks.current.filter(
    (track) =>
      track.missingFrames < 8
  );

}
return ( <div className="pointer-events-none absolute inset-0 z-30">
{tracks.current.map(
(track, index) => {
return (
<div
key={index}
className="absolute rounded-lg border-4 border-green-400"
style={{
left: `${track.box.left}px`,
top: `${track.box.top}px`,
width: `${track.box.width}px`,
height: `${track.box.height}px`,
}}
> <div className="absolute -top-16 left-0 rounded-md bg-green-500 px-3 py-2 text-sm font-bold text-black"> <div>Palack</div> <div>
Folyadékszint:{" "}
{Math.round(track.level)}% </div> </div>

          <div
            className="absolute left-0 right-0 border-t-4 border-red-500"
            style={{
              top: `${
                100 - track.level
              }%`,
            }}
          />
        </div>
      );
    }
  )}
</div>

);
}


