import React, { useMemo, useState } from 'react';
import { Hairstyle, HistoryItem } from '../types';
import Loader from './Loader';
import ImageComparator from './ImageComparator';

interface VirtualMirrorProps {
  originalImage: string | null;
  styledImage: string | null;
  isLoading: boolean;
  selectedStyle: Hairstyle | null;
  styles: Hairstyle[];
  genderFilter: 'male' | 'female';
  onGenderFilterChange: (gender: 'male' | 'female') => void;
  history: HistoryItem[];
  onSelectStyle: (style: Hairstyle) => void;
  onHistorySelect: (item: HistoryItem) => void;
  onDownload: () => void;
  onShare?: () => void;
  onStartOver: () => void;
  onDiscard: () => void;
  onRegenerate?: () => void;
  onRequestFrontView?: () => void;
  onRequestBackView?: () => void;
  onRequestSideView?: () => void;
  onTurnIntoVideo?: () => void;
  isVideoGenerating?: boolean;
  generatedVideoUrl?: string | null;
  onGenerate360View?: () => void;
  is360ViewGenerating?: boolean;
  generated360VideoUrl?: string | null;
  isViewAngleImage?: boolean;
}

const VirtualMirror: React.FC<VirtualMirrorProps> = ({
  originalImage,
  styledImage,
  isLoading,
  selectedStyle,
  styles,
  genderFilter,
  onGenderFilterChange,
  onSelectStyle,
  onDownload,
  onShare,
  onDiscard,
  onRegenerate,
  onStartOver,
  onRequestFrontView,
  onRequestBackView,
  onRequestSideView,
  history,
  onHistorySelect,
  onTurnIntoVideo,
  isVideoGenerating,
  generatedVideoUrl,
  onGenerate360View,
  is360ViewGenerating,
  generated360VideoUrl,
  isViewAngleImage = false
}) => {
  const displayStyles: Hairstyle[] = useMemo(() => (styles || []), [styles]);
  const selectedStyleForHighlight = selectedStyle;
  return (
    <div className="flex-grow grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-4 lg:gap-6 p-2 sm:p-4 lg:p-6 animate-fade-in">
      {/* Left: Current Image Panel - order 1 on mobile, 1 on desktop */}
      <div className="col-span-1 order-1">
        <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-4 lg:p-6 h-full border border-gray-200 shadow-md">
          <h3 className="text-sm sm:text-lg lg:text-xl font-bold mb-2 sm:mb-4 lg:mb-6 text-gray-900 flex items-center animate-slide-in-left">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-1 sm:mr-2 lg:mr-3 text-[#E1262D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">My Image</span>
            <span className="sm:hidden">My Image</span>
          </h3>

          <div className="relative aspect-square bg-gray-50 rounded-lg sm:rounded-xl overflow-hidden border border-gray-200 shadow-lg transform transition-all duration-300 hover:shadow-xl hover:border-gray-300">
          {originalImage ? (
              <img
                src={originalImage}
                alt="Original"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <div className="text-center animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 lg:h-12 lg:w-12 mx-auto mb-2 lg:mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                  <p className="text-xs lg:text-sm">Upload an image to begin</p>
            </div>
            </div>
          )}
        </div>

          {/* Change Image Button */}
          {originalImage && (
            <button
              onClick={onStartOver}
              className="mt-4 w-full bg-[#E1262D] hover:bg-[#B91C1C] text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Change Photo</span>
            </button>
          )}
      </div>
      </div>

      {/* Center: Styled Preview Panel - order 3 on mobile (after styles), order 2 on desktop */}
      <div className="col-span-1 order-3 md:order-2">
        <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-4 lg:p-6 h-full border border-gray-200 shadow-md">
          <h3 className="text-sm sm:text-lg lg:text-xl font-bold mb-2 sm:mb-4 lg:mb-6 text-gray-900 flex items-center animate-slide-in-up">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 mr-1 sm:mr-2 lg:mr-3 text-[#E1262D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="hidden sm:inline">Styled Preview</span>
            <span className="sm:hidden">Preview</span>
          </h3>

          <div className="relative aspect-square bg-gray-50 rounded-lg sm:rounded-xl overflow-hidden border border-gray-200 shadow-lg transform transition-all duration-300 hover:shadow-xl hover:border-gray-300">
            {isLoading && <Loader />}
            {styledImage ? (
              isViewAngleImage ? (
                <img
                  src={styledImage}
                  alt="Styled view"
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageComparator
                  originalImage={originalImage!}
                  styledImage={styledImage}
                  isLoading={isLoading}
                  onDownload={onDownload}
                  onShare={onShare}
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <div className="text-center animate-pulse">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-[#E1262D] mx-auto mb-2 lg:mb-3"></div>
                      <p className="text-xs lg:text-sm font-medium">Processing...</p>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 lg:h-12 lg:w-12 mx-auto mb-2 lg:mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                      </svg>
                      <p className="text-xs lg:text-sm font-medium">Select a preset style to preview</p>
                      <p className="text-xs text-gray-400">Choose from the styles on the right</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Minimal View Buttons */}
          {styledImage && onRequestFrontView && onRequestBackView && onRequestSideView && (
            <div className="mt-4 lg:mt-6">
              <h4 className="text-sm font-medium mb-3 text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Angles
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={onRequestFrontView}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center py-3 px-2 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-50 disabled:cursor-not-allowed border border-gray-200 hover:border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E1262D]/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-600">Front</span>
                </button>

                <button
                  onClick={onRequestSideView}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center py-3 px-2 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-50 disabled:cursor-not-allowed border border-gray-200 hover:border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E1262D]/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-600">Side</span>
                </button>

                <button
                  onClick={onRequestBackView}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center py-3 px-2 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-50 disabled:cursor-not-allowed border border-gray-200 hover:border-gray-300 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E1262D]/50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-600">Back</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {styledImage && (
            <div className="mt-4 lg:mt-6 space-y-3 lg:space-y-4 animate-slide-in-up delay-300">{/* Download and Share buttons removed - available in image comparator */}

              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  disabled={isLoading}
                  className="w-full group relative bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-blue-500 disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 lg:py-4 px-4 rounded-xl lg:rounded-2xl transition-all duration-500 transform hover:scale-105 disabled:hover:scale-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-white shadow-2xl hover:shadow-indigo-500/40 overflow-hidden"
                >
                  <div className="relative flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 lg:h-6 lg:w-6 mr-2 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                    </svg>
                    <span className="text-xs lg:text-sm font-semibold">Regenerate</span>
                  </div>
                </button>
              )}

              <button
                onClick={onDiscard}
                className="w-full group relative bg-gradient-to-br from-red-600 via-red-500 to-red-700 hover:from-red-500 hover:via-red-400 hover:to-red-600 text-white font-medium py-3 lg:py-4 px-4 rounded-xl lg:rounded-2xl transition-all duration-500 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-500/50 focus:ring-offset-2 focus:ring-offset-white shadow-2xl hover:shadow-red-500/40 overflow-hidden"
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 via-red-300/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer"></div>

                {/* Floating particles */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-2 left-4 w-1 h-1 bg-white/60 rounded-full animate-float" style={{ animationDelay: '0s', animationDuration: '3s' }}></div>
                  <div className="absolute top-2 right-4 w-1 h-1 bg-white/40 rounded-full animate-float" style={{ animationDelay: '1s', animationDuration: '4s' }}></div>
                  <div className="absolute bottom-2 left-1/3 w-1 h-1 bg-white/50 rounded-full animate-float" style={{ animationDelay: '2s', animationDuration: '3.5s' }}></div>
                  <div className="absolute bottom-2 right-1/3 w-1 h-1 bg-white/30 rounded-full animate-float" style={{ animationDelay: '0.5s', animationDuration: '4.5s' }}></div>
                </div>

                {/* Glowing border effect */}
                <div className="absolute inset-0 rounded-xl lg:rounded-2xl bg-gradient-to-r from-red-400 via-red-300 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"></div>
                <div className="absolute inset-[1px] rounded-xl lg:rounded-2xl bg-gradient-to-br from-red-600 via-red-500 to-red-700"></div>

                <div className="relative flex items-center justify-center">
                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 lg:h-6 lg:w-6 mr-2 group-hover:scale-125 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                    {/* Icon glow effect */}
                    <div className="absolute inset-0 w-5 h-5 lg:w-6 lg:h-6 bg-red-400 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
                  </div>
                  <span className="text-xs lg:text-sm font-semibold group-hover:text-red-100 transition-colors duration-300">Discard</span>
                </div>
              </button>

              {/* Video Generation Buttons */}
              {(onTurnIntoVideo || onGenerate360View) && (
                <div className="grid grid-cols-1 gap-3">
                  {/* Turn into Video Button */}
                  {onTurnIntoVideo && (
                    <button
                      onClick={onTurnIntoVideo}
                      disabled={isVideoGenerating || is360ViewGenerating}
                      className="w-full group relative bg-[#E1262D] hover:bg-[#B91C1C] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 lg:py-4 px-4 rounded-xl lg:rounded-2xl transition-all duration-500 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#E1262D]/50 focus:ring-offset-2 focus:ring-offset-white shadow-2xl hover:shadow-[#E1262D]/40 disabled:hover:scale-100 overflow-hidden"
                    >
                      <div className="relative flex items-center justify-center">
                        <div className="relative">
                          {isVideoGenerating ? (
                            <svg className="animate-spin h-5 w-5 lg:h-6 lg:w-6 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 lg:h-6 lg:w-6 mr-2 group-hover:scale-125 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs lg:text-sm font-semibold group-hover:text-white transition-colors duration-300">
                          {isVideoGenerating ? 'Generating Video...' : 'Turn into Video'}
                        </span>
                      </div>
                    </button>
                  )}

                  {/* 360° View Button */}
                  {onGenerate360View && (
                    <button
                      onClick={onGenerate360View}
                      disabled={is360ViewGenerating || isVideoGenerating}
                      className="w-full group relative bg-[#E1262D] hover:bg-[#B91C1C] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 lg:py-4 px-4 rounded-xl lg:rounded-2xl transition-all duration-500 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-[#E1262D]/50 focus:ring-offset-2 focus:ring-offset-white shadow-2xl hover:shadow-[#E1262D]/40 disabled:hover:scale-100 overflow-hidden"
                    >
                      <div className="relative flex items-center justify-center">
                        <div className="relative">
                          {is360ViewGenerating ? (
                            <svg className="animate-spin h-5 w-5 lg:h-6 lg:w-6 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 lg:h-6 lg:w-6 mr-2 group-hover:scale-125 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              <circle cx="12" cy="12" r="8" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} className="opacity-60"/>
                            </svg>
                          )}
                        </div>
                        <span className="text-xs lg:text-sm font-semibold group-hover:text-white transition-colors duration-300">
                          {is360ViewGenerating ? 'Generating 360° View...' : '360° View'}
                        </span>
                      </div>
                    </button>
                  )}
                </div>
              )}

              {/* Video Player Displays */}
              {generatedVideoUrl && (
                <div className="w-full mt-4 rounded-xl overflow-hidden border-2 border-[#E1262D]/50 shadow-2xl animate-slide-in-up">
                  <video
                    src={generatedVideoUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    className="w-full aspect-square object-cover bg-black"
                    aria-label="Generated hair transition video"
                  >
                    Your browser does not support the video tag.
                  </video>
                  <div className="bg-white border-t border-gray-200 p-2 text-center">
                    <p className="text-xs text-[#E1262D] font-semibold">✨ Transition Video Ready!</p>
                  </div>
                </div>
              )}

              {/* 360° Video Player Display */}
              {generated360VideoUrl && (
                <div className="w-full mt-4 rounded-xl overflow-hidden border-2 border-[#E1262D]/50 shadow-2xl animate-slide-in-up">
                  <video
                    src={generated360VideoUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    className="w-full aspect-square object-cover bg-black"
                    aria-label="Generated 360° hair view video"
                  >
                    Your browser does not support the video tag.
                  </video>
                  <div className="bg-white border-t border-gray-200 p-2 text-center flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#E1262D] animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      <circle cx="12" cy="12" r="8" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} className="opacity-50"/>
                    </svg>
                    <p className="text-xs text-[#E1262D] font-semibold">🌟 360° View Ready!</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Style Selector - order 2 on mobile (right after photo), order 3 on desktop */}
      <div className="col-span-1 order-2 md:order-3 md:col-span-2 xl:col-span-1">
        <div className="bg-white rounded-xl sm:rounded-2xl p-2 sm:p-4 lg:p-6 border border-gray-200 shadow-md">
          <h3 className="text-sm sm:text-lg lg:text-xl font-bold mb-2 sm:mb-4 lg:mb-6 text-gray-900 flex items-center animate-slide-in-right">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 lg:h-6 lg:w-6 mr-2 lg:mr-3 text-[#E1262D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
            </svg>
            Select Style
          </h3>

          {/* Gender Filter Toggle */}
          <div className="flex gap-2 mb-4 animate-slide-in-right delay-50">
            <button
              onClick={() => onGenderFilterChange('male')}
              className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 font-medium
                ${genderFilter === 'male'
                  ? 'bg-[#E1262D] text-white shadow-lg shadow-[#E1262D]/30'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Male
            </button>
            <button
              onClick={() => onGenderFilterChange('female')}
              className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 font-medium
                ${genderFilter === 'female'
                  ? 'bg-[#E1262D] text-white shadow-lg shadow-[#E1262D]/30'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 3c0 0 -1 2 -1 4s1 4 1 4" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 3c0 0 1 2 1 4s-1 4 -1 4" />
              </svg>
              Female
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4 animate-slide-in-right delay-100">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search styles..."
              className="w-full pl-10 pr-4 py-2 lg:py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E1262D] focus:border-[#E1262D] transition-all duration-300 text-sm lg:text-base"
            />
          </div>



          {/* Style Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-h-[500px] overflow-y-auto pr-1 sm:pr-2 custom-scrollbar animate-slide-in-right delay-300">
            {displayStyles.map((style, index) => {
              const isSelected = selectedStyleForHighlight?.id === style.id;
              return (
              <button
                key={style.id}
                onClick={() => onSelectStyle(style)}
                disabled={isLoading}
                className={`group flex flex-col bg-white rounded-xl overflow-hidden border-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#E1262D] shadow-sm hover:shadow-md
                    ${isSelected ? 'border-[#E1262D]' : 'border-gray-200 hover:border-gray-300'}
                  ${isLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                aria-label={`Select style: ${style.name}`}
              >
                  {/* Image container - fixed height, no absolute positioning */}
                  <div className="w-full h-32 sm:h-36 overflow-hidden bg-gray-50">
                    <img
                      src={style.thumbnailUrl}
                      alt={`${style.name} style preview`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/hairstyles/classic-side-part.png';
                      }}
                    />
                  </div>

                  {/* Style Name Label - in normal flow below image */}
                  <div className="w-full px-2 py-2 bg-gray-100 border-t border-gray-200">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-gray-800 text-center truncate flex-1">
                        {style.name}
                      </p>
                      {isSelected && isLoading && (
                        <div className="w-4 h-4 flex-shrink-0 bg-[#E1262D] rounded-full flex items-center justify-center">
                          <svg className="animate-spin h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                      {isSelected && !isLoading && (
                        <div className="w-4 h-4 flex-shrink-0 bg-[#E1262D] rounded-full flex items-center justify-center">
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
              </button>
              );
            })}
          </div>

          {/* Style Counter */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              {displayStyles.length} styles available
            </p>
          </div>

          {/* Start Over Button */}
          <div className="mt-4 animate-slide-in-right delay-400">
            <button
              onClick={onStartOver}
              className="group relative w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 lg:py-4 px-4 rounded-xl lg:rounded-2xl transition-all duration-500 flex items-center justify-center overflow-hidden"
            >
              <div className="relative flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 lg:h-5 lg:w-5 mr-2 lg:mr-3 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-xs lg:text-sm font-semibold transition-colors duration-300">Start Over</span>
              </div>
            </button>
          </div>
        </div>
          </div>

      {/* Previous Styles Section - Bottom */}
      {(history?.length || 0) > 0 && (
        <div className="xl:col-span-3 mt-6 animate-slide-in-up delay-400">
          <div className="bg-white rounded-2xl p-4 lg:p-6 border border-gray-200 shadow-md">
            <h4 className="text-lg lg:text-xl font-bold mb-4 lg:mb-6 text-gray-900 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 lg:h-6 lg:w-6 mr-2 lg:mr-3 text-[#E1262D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Previous Styles
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(history || []).slice(0, 3).map((item, index) => (
            <button
                  key={index}
                  onClick={() => onHistorySelect(item)}
                  className="group relative aspect-square bg-white rounded-xl overflow-hidden border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#E1262D] focus:ring-offset-2 focus:ring-offset-white"
                >
                  <img
                    src={item.imageUrl}
                    alt={`Previous style: ${item.styleName}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <div className="flex items-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#E1262D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
                      <span className="text-sm font-medium truncate">{item.styleName}</span>
                    </div>
                  </div>
            </button>
              ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default VirtualMirror;
