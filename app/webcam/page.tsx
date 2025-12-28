import WebcamDisplay from "@/app/components/features/webcam/WebcamDisplay";

export const metadata = {
  title: "Webcam App | Next.js 16",
  description: "Secure browser-based camera capture",
};

export default function WebcamPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Camera Interface</h1>
      
      {/* Wrapper for layout and instructions */}
      <div className="w-full max-w-4xl bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
        <p className="text-sm text-center text-gray-500 mb-6">
          Please allow camera permissions in your browser when prompted.
        </p>
        
        <WebcamDisplay />
      </div>
    </main>
  );
}