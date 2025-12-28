"use client";

import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user",
};

export default function WebcamDisplay() {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImg, setCapturedImg] = useState<string | null>(null);

  // Capture the current frame as a base64 string
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
        console.log("Captured image: ", imageSrc);
      setCapturedImg(imageSrc);
    }
  }, [webcamRef]);

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl">
        {!capturedImg ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="w-full max-w-2xl h-auto"
            mirrored={true}
          />
        ) : (
          <img src={capturedImg} alt="Captured" className="w-full max-w-2xl" />
        )}
      </div>

      <div className="flex gap-4">
        {!capturedImg ? (
          <button
            onClick={capture}
            className="px-6 py-2 font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition"
          >
            Take Photo
          </button>
        ) : (
          <button
            onClick={() => setCapturedImg(null)}
            className="px-6 py-2 font-bold text-white bg-gray-600 rounded-full hover:bg-gray-700 transition"
          >
            Retake
          </button>
        )}
      </div>
    </div>
  );
}