"use client";
import React, { useEffect, useRef, useCallback } from "react";
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import Webcam from "react-webcam";

export default function FaceLandmarkerComponent() {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const landmarkerRef = useRef<FaceLandmarker | null>(null);
    const lastVideoTime = useRef<number>(-1);
    const requestRef = useRef<number>(0);

    const predict = useCallback(() => {
        const video = webcamRef.current?.video;
        const canvas = canvasRef.current;

        if (video && video.readyState === 4 && landmarkerRef.current && canvas) {
            // Only process if the video frame has actually progressed
            if (video.currentTime !== lastVideoTime.current) {
                lastVideoTime.current = video.currentTime;

                // Sync canvas internal resolution to video stream resolution
                if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                }

                const results = landmarkerRef.current.detectForVideo(video, performance.now());
                const ctx = canvas.getContext("2d");

                if (ctx && results.faceLandmarks) {
                    ctx.save();
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    // Mirror the drawing to match the mirrored webcam display
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);

                    const drawingUtils = new DrawingUtils(ctx);
                    
                    for (const landmarks of results.faceLandmarks) {
                        // 1. Draw the detailed face mesh tessellation
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: "#C0C0C070", lineWidth: 1 });
                        
                        // 2. Draw specific feature sets for a "Pro" look
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE, { color: "#FF3030" });
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_EYE, { color: "#30FF30" });
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: "#E0E0E0", lineWidth: 2 });
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LIPS, { color: "#E0E0E0" });
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_RIGHT_IRIS, { color: "#FF3030" });
                        drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_LEFT_IRIS, { color: "#30FF30" });
                    }
                    ctx.restore();
                }
            }
        }
        requestRef.current = requestAnimationFrame(predict);
    }, []);

    useEffect(() => {
        const initModel = async () => {
            // Ensure local WASM assets are used for 2025 stability
            const vision = await FilesetResolver.forVisionTasks("/wasm");

            landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numFaces: 1,
                outputFaceBlendshapes: true, // Useful for 2025 graph stability
            });
            
            requestRef.current = requestAnimationFrame(predict);
        };

        initModel();

        // Cleanup on unmount to prevent memory leaks/zombie loops
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            landmarkerRef.current?.close();
        };
    }, [predict]);

    return (
        <div className="relative group overflow-hidden rounded-3xl border-4 border-white shadow-2xl bg-black aspect-video">
            <Webcam 
                ref={webcamRef} 
                className="w-full h-full object-cover" 
                mirrored 
                videoConstraints={{ width: 1280, height: 720, facingMode: "user" }}
            />
            <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full pointer-events-none" 
            />
        </div>
    );
}
