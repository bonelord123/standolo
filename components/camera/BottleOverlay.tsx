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

useEffect(() => {
function updateSize() {
setScreenSize({
width: window.innerWidth,
height: window.innerHeight,
});
}

```
updateSize();

window.addEventListener("resize", updateSize);

return () => {
  window.removeEventListener("resize", updateSize);
};
```

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
const maxTrackingDistance = 300;

const detectedBoxes: {
box: Box;
score?: number;
}[] = [];

detections.forEach((detection) => {
if (!detection.boundingBox) {
return;
}

```
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
```

});

/*

* Ha nincs detekció, töröljük a régi trackeket.
  */
  if (detectedBoxes.length === 0) {
  tracks.current = [];
  } else {
  /*

  * Megjelöljük, melyik régi tracket használtuk már.
    */
    const usedTracks = new Set<number>();

```
/*
```

```
 * Először a legjobb párosításokat keressük meg.
 */
const matches: {
  detectionIndex: number;
  trackIndex: number;
  distance: number;
}[] = [];

detectedBoxes.forEach((detected, detectionIndex) => {
  const detectedCenterX =
    detected.box.left +
    detected.box.width / 2;

  const detectedCenterY =
    detected.box.top +
    detected.box.height / 2;

  tracks.current.forEach((track, trackIndex) => {
    const trackCenterX =
      track.box.left +
      track.box.width / 2;

    const trackCenterY =
      track.box.top +
      track.box.height / 2;

    const dx =
      detectedCenterX - trackCenterX;

    const dy =
      detectedCenterY - trackCenterY;

    const distance = Math.sqrt(
      dx * dx + dy * dy
    );

    if (distance <= maxTrackingDistance) {
      matches.push({
        detectionIndex,
        trackIndex,
        distance,
      });
    }
  });
});

/*
 * A legközelebbi párosításokat használjuk először.
 */
matches.sort(
  (a, b) => a.distance - b.distance
);

const matchedDetections = new Set<number>();

matches.forEach((match) => {
  if (
    matchedDetections.has(
      match.detectionIndex
    )
  ) {
    return;
  }

  if (usedTracks.has(match.trackIndex)) {
    return;
  }

  const detected =
    detectedBoxes[match.detectionIndex];

  const track =
    tracks.current[match.trackIndex];

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

  track.missingFrames = 0;

  usedTracks.add(match.trackIndex);
  matchedDetections.add(
    match.detectionIndex
  );
});

/*
 * Az új, még nem követett palackokhoz
 * új tracket hozunk létre.
 */
detectedBoxes.forEach(
  (detected, detectionIndex) => {
    if (
      matchedDetections.has(
        detectionIndex
      )
    ) {
      return;
    }

    tracks.current.push({
      box: detected.box,
      missingFrames: 0,
    });
  }
);

/*
 * Ha egy palackot néhány képkockán át
 * nem látunk, még nem töröljük azonnal.
 */
tracks.current.forEach(
  (track, trackIndex) => {
    if (!usedTracks.has(trackIndex)) {
      track.missingFrames += 1;
    }
  }
);

tracks.current =
  tracks.current.filter(
    (track) =>
      track.missingFrames < 8
  );
```

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
> <div className="absolute -top-8 left-0 rounded-md bg-green-500 px-2 py-1 text-sm font-bold text-black">
Palack </div> </div>
);
}
)} </div>
);
}
