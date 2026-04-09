
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const startCamera = useCallback(async () => {
    setError(null);
    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1024 },
          height: { ideal: 1024 }
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setError('blocked');
      } else {
        setError('Could not access camera. Please try again.');
      }
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (context) {
      // Flip the image horizontally to undo the mirror effect
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture-${Date.now()}.png`, { type: 'image/png' });
          onCapture(file);
        } else {
          setError("Failed to capture image.");
        }
        setIsCapturing(false);
      }, 'image/png');
    } else {
        setError("Failed to get canvas context.");
        setIsCapturing(false);
    }
  }, [onCapture, isCapturing]);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl relative text-gray-900 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-center">Camera Capture</h2>
        {error ? (
          <div className="text-center p-6">
            {error === 'blocked' ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-red-600 font-semibold mb-2">Camera Access Blocked</p>
                <p className="text-gray-500 text-sm mb-4">
                  To use the camera, please allow access:
                </p>
                <div className="text-left bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-600 space-y-2">
                  <p><strong>Chrome:</strong> Click the lock/camera icon in the address bar → Allow camera</p>
                  <p><strong>Safari:</strong> Settings → Websites → Camera → Allow</p>
                  <p><strong>Mobile:</strong> Go to browser Settings → Site Settings → Camera → Allow</p>
                </div>
                <button
                  onClick={startCamera}
                  className="px-6 py-2.5 bg-[#E1262D] hover:bg-[#B91C1C] text-white font-medium rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </>
            ) : (
              <>
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={startCamera}
                  className="px-6 py-2.5 bg-[#E1262D] hover:bg-[#B91C1C] text-white font-medium rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="relative aspect-square w-full bg-black rounded-md overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect for user experience
            />
             <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        <div className="mt-6 flex justify-center items-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white"
            aria-label="Close camera"
          >
            Cancel
          </button>
          <button
            onClick={handleCapture}
            disabled={!!error || isCapturing}
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#E1262D] hover:bg-[#c82126] disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E1262D] focus:ring-offset-white"
            aria-label="Capture photo"
          >
            {isCapturing ? 'Capturing...' : (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Capture
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCapture;
