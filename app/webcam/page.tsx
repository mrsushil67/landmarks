import FaceLandmarker from "@/app/components/features/webcam/FaceLandmarker";

export default async function WebcamPage() {
  // Next.js 16 'use cache' marks this segment for instant delivery
  "use cache"; 
  
  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-6">
        <header className="text-center">
          <h1 className="text-4xl font-black text-white tracking-tight">AI Vision Pro</h1>
          <p className="text-slate-400">Next.js 16 Real-time 478-point Mesh Detection</p>
        </header>
        
        {/* The interactive client component */}
        <FaceLandmarker />
      </div>
    </main>
  );
}