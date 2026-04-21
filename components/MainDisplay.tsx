
import React from 'react';
import ImageComparator from './ImageComparator';
import Loader from './Loader';

interface MainDisplayProps {
  originalImage: string | null;
  styledImage: string | null;
  isLoading: boolean;
  onRequestFrontView?: () => void;
  onRequestSideView?: () => void;
  onRequestBackView?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onStartOver?: () => void;
  onDiscard?: () => void;
}

const MainDisplay: React.FC<MainDisplayProps> = ({
    originalImage,
    styledImage,
    isLoading,
    onRequestFrontView,
    onRequestSideView,
    onRequestBackView,
    onDownload,
    onShare,
    onStartOver,
    onDiscard,
}) => {
  const showViewButtons = (onRequestFrontView || onRequestSideView || onRequestBackView) && styledImage && !isLoading;
  const showActionButtons = styledImage && !isLoading;

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Virtual Mirror</h2>
        <div className="flex gap-2">
          {onStartOver && (
            <button
              onClick={onStartOver}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 focus:ring-offset-white text-sm flex items-center"
              aria-label="Start over with a new image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Start Over
            </button>
          )}
          {onDiscard && styledImage && (
            <button
              onClick={onDiscard}
              className="bg-[#E1262D] hover:bg-[#c82128] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#E1262D] focus:ring-offset-2 focus:ring-offset-white text-sm flex items-center"
              aria-label="Discard current styled image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Discard
            </button>
          )}
        </div>
      </div>
      <div className="flex justify-center">
        {originalImage && !styledImage && (
             <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-5xl relative">
                 {isLoading && <Loader />}
                 <div className="w-full aspect-square bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                     <h3 className="text-center py-2 text-sm font-semibold bg-gray-50 text-gray-600">Current Image</h3>
                     <div className="relative flex-grow flex items-center justify-center">
                         <img src={originalImage} alt="Current" className="w-full h-full object-contain" />
                     </div>
                 </div>
                 <div className="w-full aspect-square bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                     <h3 className="text-center py-2 text-sm font-semibold bg-gray-50 text-gray-600">Image with Style Applied</h3>
                     <div className="relative flex-grow flex items-center justify-center text-gray-500">
                         {isLoading ? "Processing..." : "Select a style to begin"}
                     </div>
                 </div>
             </div>
        )}
        {originalImage && styledImage && (
            <div className="w-full max-w-2xl relative">
                {isLoading && <Loader />}
                <ImageComparator
                    originalImage={originalImage}
                    styledImage={styledImage}
                    isLoading={isLoading}
                    onDownload={showActionButtons ? onDownload : undefined}
                    onShare={showActionButtons ? onShare : undefined}
                >
                    {showViewButtons && (
                         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 transition-opacity duration-300 opacity-75 group-hover:opacity-100 focus-within:opacity-100">
                            {onRequestFrontView && (
                                <button
                                    onClick={onRequestFrontView}
                                    className="bg-[#E1262D] hover:bg-[#c82128] text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#E1262D] focus:ring-offset-2 focus:ring-offset-white text-sm flex items-center"
                                    aria-label="Regenerate style with a front view"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                    </svg>
                                    Front View
                                </button>
                            )}
                            {onRequestSideView && (
                                <button
                                    onClick={onRequestSideView}
                                    className="bg-[#E1262D] hover:bg-[#c82128] text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#E1262D] focus:ring-offset-2 focus:ring-offset-white text-sm flex items-center"
                                    aria-label="Regenerate style with a side view"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                    Side View
                                </button>
                            )}
                            {onRequestBackView && (
                                <button
                                    onClick={onRequestBackView}
                                    className="bg-[#E1262D] hover:bg-[#c82128] text-white font-semibold py-2 px-3 rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#E1262D] focus:ring-offset-2 focus:ring-offset-white text-sm flex items-center"
                                    aria-label="Regenerate style with a back view"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                    Back View
                                </button>
                            )}
                        </div>
                    )}
                </ImageComparator>
            </div>
        )}
      </div>
    </div>
  );
};

export default MainDisplay;
