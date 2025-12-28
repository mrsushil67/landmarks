"use client";
import React, { useEffect, useRef, useCallback } from "react";
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import Webcam from "react-webcam";

export default function FaceLandmarkerComponent() {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const landmarkerRef = useRef<FaceLandmarker | null>(null);

    const predict = useCallback(() => {
        const video = webcamRef.current?.video;
        const canvas = canvasRef.current;

        if (video?.readyState === 4 && landmarkerRef.current && canvas) {
            // 1. Sync canvas size to video size for accurate coordinate mapping
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            const results = landmarkerRef.current.detectForVideo(video, performance.now());
            const ctx = canvas.getContext("2d");

            if (ctx && results.faceLandmarks) {
                ctx.save();
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // 2. Mirror the canvas context to match the mirrored webcam
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);

                const drawingUtils = new DrawingUtils(ctx);
                for (const landmarks of results.faceLandmarks) {
                    drawingUtils.drawConnectors(
                        landmarks, 
                        FaceLandmarker.FACE_LANDMARKS_TESSELATION, 
                        { color: "#C0C0C070", lineWidth: 1 }
                    );
                }
                ctx.restore();
            }
        }
        requestAnimationFrame(predict);
    }, []);

    useEffect(() => {
        const initModel = async () => {
            const vision = await FilesetResolver.forVisionTasks("/wasm");

            landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numFaces: 1
            });
            
            // 3. Start the loop immediately after the model is ready
            requestAnimationFrame(predict);
        };

        initModel();
    }, [predict]); // Include predict here to ensure loop starts with correct ref

    return (
        <div className="relative group overflow-hidden rounded-3xl border-4 border-white shadow-2xl bg-black">
            <Webcam 
                ref={webcamRef} 
                className="w-full h-auto block" 
                mirrored 
                videoConstraints={{ width: 1280, height: 720 }}
            />
            <canvas 
                ref={canvasRef} 
                className="absolute inset-0 w-full h-full pointer-events-none" 
            />
        </div>
    );
}
