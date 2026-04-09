
import React, { useState, useRef, useCallback } from 'react';
import Loader from './Loader';

interface ImageComparatorProps {
  originalImage: string;
  styledImage: string;
  isLoading: boolean;
  children?: React.ReactNode; // For overlaying buttons
  onDownload?: () => void;
  onShare?: () => void;
}

const ImageComparator: React.FC<ImageComparatorProps> = ({ originalImage, styledImage, isLoading, children, onDownload, onShare }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
        ref={containerRef}
        className="relative w-full aspect-square bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden select-none group"
        style={{ touchAction: 'pan-y' }}
    >
      <img
        src={originalImage}
        alt="Original"
        className="absolute inset-0 w-full h-full object-cover"
        draggable="false"
      />
      <div
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={styledImage}
          alt="Styled"
          className="absolute inset-0 w-full h-full object-cover"
          draggable="false"
        />
      </div>

      {/* Action Buttons: Download & Share */}
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10 opacity-80 group-hover:opacity-100 transition-opacity">
        {onDownload && (
          <button
              onClick={onDownload}
              className="bg-white/80 hover:bg-white backdrop-blur-sm text-gray-700 font-semibold py-2 px-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#E1262D] focus:ring-offset-2 focus:ring-offset-white text-sm flex items-center"
              aria-label="Download styled image"
              title="Download Image"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
          </button>
        )}
        <button
            onClick={onShare}
            disabled={!onShare}
            className="bg-white/80 hover:bg-white backdrop-blur-sm text-gray-700 font-semibold py-2 px-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#E1262D] focus:ring-offset-2 focus:ring-offset-white text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Share styled image"
            title={!onShare ? "Sharing not supported in this browser" : "Share Image"}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
        </button>
      </div>

      {/* Slider Handle and Line - wide touch target for mobile */}
      <div
        className="absolute top-0 bottom-0 w-10 cursor-ew-resize z-10"
        style={{ left: `calc(${sliderPosition}% - 20px)`, touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-white/70 shadow-sm"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-lg backdrop-blur-sm flex items-center justify-center cursor-ew-resize transition-transform duration-200 group-hover:scale-110">
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7M9 19l7-7-7-7"></path></svg>
        </div>
      </div>

      {isLoading && <Loader />}
      {children}
    </div>
  );
};

export default ImageComparator;
