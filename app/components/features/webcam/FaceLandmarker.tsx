"use client";
import React, { useEffect, useRef, useCallback, useState } from "react";
import { FaceLandmarker, FilesetResolver, DrawingUtils } from "@mediapipe/tasks-vision";
import Webcam from "react-webcam";

export default function FaceLandmarkerComponent() {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const landmarkerRef = useRef<FaceLandmarker | null>(null);
    const lastVideoTime = useRef<number>(-1);
    const requestRef = useRef<number>(0);
    const [matchPercentage, setMatchPercentage] = useState<number>(0);

    const [lockStatus, setLockStatus] = useState<'locked' | 'unlocked' | 'unauthorized'>('locked');
    const registeredLandmarks = useRef<any>(null);

    // const calculateSimilarity = (face1: any[], face2: any[]): number => {
    //     let distance = 0;
    //     // Biometric key points for identity verification
    //     const keyPoints = [1, 33, 263, 61, 291, 199, 10, 152]; 
    //     for (const i of keyPoints) {
    //         if (!face1[i] || !face2[i]) continue;
    //         distance += Math.pow(face1[i].x - face2[i].x, 2) +
    //                     Math.pow(face1[i].y - face2[i].y, 2);
    //     }
    //     return Math.sqrt(distance);
    // };

    const calculateSimilarity = (face1: any[], face2: any[]): { distance: number, percentage: number } => {
        let totalDistance = 0;
        // Biometric key points (Nose, Eyes, Mouth, Chin, Forehead)
        const keyPoints = [1, 33, 263, 61, 291, 199, 10, 152];

        // USE NOSE TIP (Index 1) AS ANCHOR FOR NORMALIZATION
        const anchor1 = face1[1];
        const anchor2 = face2[1];

        for (const i of keyPoints) {
            if (!face1[i] || !face2[i]) continue;

            // Calculate relative distance from the nose tip
            const relX1 = face1[i].x - anchor1.x;
            const relY1 = face1[i].y - anchor1.y;
            const relX2 = face2[i].x - anchor2.x;
            const relY2 = face2[i].y - anchor2.y;

            totalDistance += Math.sqrt(Math.pow(relX1 - relX2, 2) + Math.pow(relY1 - relY2, 2));
        }

        const avgDistance = totalDistance / keyPoints.length;

        // Convert distance to percentage (lower distance = higher percentage)
        // 0.15 is a typical "maximum" variation for same-person recognition
        const percentage = Math.max(0, 100 - (avgDistance * 800));

        return { distance: avgDistance, percentage: Math.round(percentage) };
    };

    // 1. REGISTRATION: Only saves the master face data
    const registerFace = useCallback(() => {
        const video = webcamRef.current?.video;
        if (video && landmarkerRef.current) {
            const results = landmarkerRef.current.detectForVideo(video, performance.now());
            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                registeredLandmarks.current = results.faceLandmarks[0];
                setLockStatus('locked');
                alert('Biometric Profile Saved. System is now monitoring.');
            } else {
                alert('No face detected. Please center your face in the frame.');
            }
        }
    }, []);

    // 2. PREDICTION: Constantly monitors and compares
    const predict = useCallback(() => {
        const video = webcamRef.current?.video;
        const canvas = canvasRef.current;

        if (video && video.readyState === 4 && landmarkerRef.current && canvas) {
            if (video.currentTime !== lastVideoTime.current) {
                lastVideoTime.current = video.currentTime;

                if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                }

                const results = landmarkerRef.current.detectForVideo(video, performance.now());
                const ctx = canvas.getContext("2d");

                if (ctx) {
                    ctx.save();
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.translate(canvas.width, 0);
                    ctx.scale(-1, 1);
                    const drawingUtils = new DrawingUtils(ctx);

                    if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                        const currentFace = results.faceLandmarks[0];

                        // --- REAL-TIME COMPARISON LOGIC ---
                        if (registeredLandmarks.current) {
                            const { distance, percentage } = calculateSimilarity(registeredLandmarks.current, currentFace);
                            setMatchPercentage(percentage);

                            const AUTH_THRESHOLD = 0.08; // Adjust this: smaller = stricter

                            if (distance < AUTH_THRESHOLD) {
                                if (lockStatus !== 'unlocked') setLockStatus('unlocked');
                            } else {
                                if (lockStatus !== 'unauthorized') setLockStatus('unauthorized');
                            }
                        }

                        const meshColor = lockStatus === 'unlocked' ? "#00FF00AA" :
                            lockStatus === 'unauthorized' ? "#FF0000AA" : "#C0C0C070";

                        for (const landmarks of results.faceLandmarks) {
                            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_TESSELATION, { color: meshColor, lineWidth: 1 });
                            drawingUtils.drawConnectors(landmarks, FaceLandmarker.FACE_LANDMARKS_FACE_OVAL, { color: "#FFFFFF", lineWidth: 2 });
                        }
                    } else {
                        // Reset to locked if no face is in view
                        if (lockStatus !== 'locked') setLockStatus('locked');
                    }
                    ctx.restore();
                }
            }
        }
        requestRef.current = requestAnimationFrame(predict);
    }, [lockStatus]);

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
            requestRef.current = requestAnimationFrame(predict);
        };
        initModel();
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            landmarkerRef.current?.close();
        };
    }, [predict]);

    return (
        <div className="flex flex-col items-center gap-4 p-4">
            <div className="relative overflow-hidden rounded-3xl border-4 border-slate-800 bg-black aspect-video w-full max-w-2xl shadow-2xl">
                <Webcam ref={webcamRef} className="w-full h-full object-cover" mirrored videoConstraints={{ width: 1280, height: 720, facingMode: "user" }} />
                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

                {/* Status Overlay */}
                <div className={`absolute top-6 left-6 px-6 py-2 rounded-full font-black text-sm tracking-widest shadow-lg transition-all duration-300 ${lockStatus === 'unlocked' ? 'bg-green-600 text-white' :
                        lockStatus === 'unauthorized' ? 'bg-red-600 text-white animate-pulse' :
                            'bg-slate-800 text-slate-400'
                    }`}>
                    {lockStatus === 'unlocked' ? `🔓 AUTHORIZED (${matchPercentage}%)` :
                        lockStatus === 'unauthorized' ? `⚠️ UNAUTHORIZED (${matchPercentage}%)` : '🔒 MONITORING'}
                </div>
            </div>

            <div className="flex gap-4">
                <button onClick={registerFace} className="px-8 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-500 transition-all active:scale-95 shadow-lg">
                    Register Face
                </button>
                <button onClick={() => { registeredLandmarks.current = null; setLockStatus('locked'); }} className="px-8 py-3 bg-slate-700 text-white rounded-full font-bold hover:bg-slate-600 transition-all active:scale-95 shadow-lg">
                    Clear Profile
                </button>
            </div>

            {lockStatus === 'unauthorized' && (
                <div className="bg-red-950/30 border border-red-500/50 p-3 rounded-xl">
                    <p className="text-red-400 text-sm font-medium">⚠️ Security Alert: Unknown face detected. Access restricted.</p>
                </div>
            )}
        </div>
    );
}
