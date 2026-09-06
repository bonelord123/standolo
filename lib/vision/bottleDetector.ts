import {
    FilesetResolver,
    ObjectDetector,
    Detection,
  } from "@mediapipe/tasks-vision";
  
  let detector: ObjectDetector | null = null;
  
  export async function initializeBottleDetector() {
    if (detector) {
      return detector;
    }
  
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
  
    detector = await ObjectDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/models/efficientdet_lite0_uint8.tflite",
      },
  
      runningMode: "VIDEO",
  
      scoreThreshold: 0.5,
  
      categoryAllowlist: ["bottle"],
    });
  
    return detector;
  }
  
  export function detectBottles(
    video: HTMLVideoElement,
    timestamp: number
  ): Detection[] {
    if (!detector) {
      return [];
    }
  
    const result = detector.detectForVideo(video, timestamp);
  
    return result.detections;
  }