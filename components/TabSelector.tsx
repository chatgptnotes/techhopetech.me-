import React from 'react';

export type TabType = 'virtual-mirror' | 'ai-generator' | 'gallery';

interface TabSelectorProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isLoggedIn?: boolean;
}

const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, onTabChange, isLoggedIn = false }) => {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="w-full overflow-x-auto scrollbar-hide">
        <div className="flex space-x-1 min-w-max px-2 sm:px-4 lg:px-8 lg:justify-center">
          <button
            onClick={() => onTabChange('virtual-mirror')}
            className={`relative py-2 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-6 rounded-t-xl lg:rounded-t-2xl font-semibold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
              activeTab === 'virtual-mirror'
                ? 'bg-[#E1262D] text-white shadow-lg shadow-[#E1262D]/25'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 active:bg-gray-300 active:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className={`p-1.5 sm:p-1.5 lg:p-2 rounded-lg ${activeTab === 'virtual-mirror' ? 'bg-white/20' : 'bg-gray-200'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-bold text-xs sm:text-sm">Remix My Hair</div>
                <div className={`text-[10px] sm:text-xs ${activeTab === 'virtual-mirror' ? 'text-white/80' : 'text-gray-400'}`}>
                  Select Style
                </div>
              </div>
            </div>
            {activeTab === 'virtual-mirror' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-[#E1262D] rounded-t-full"></div>
            )}
          </button>

          <button
            onClick={() => onTabChange('ai-generator')}
            className={`relative py-2 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-6 rounded-t-xl lg:rounded-t-2xl font-semibold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
              activeTab === 'ai-generator'
                ? 'bg-[#E1262D] text-white shadow-lg shadow-[#E1262D]/25'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 active:bg-gray-300 active:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className={`p-1.5 sm:p-1.5 lg:p-2 rounded-lg ${activeTab === 'ai-generator' ? 'bg-white/20' : 'bg-gray-200'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-bold text-xs sm:text-sm flex items-center gap-1">
                  AI Style Generator
                  {!isLoggedIn && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>
                <div className={`text-[10px] sm:text-xs ${activeTab === 'ai-generator' ? 'text-white/80' : 'text-gray-400'}`}>
                  Custom Prompts
                </div>
              </div>
            </div>
            {activeTab === 'ai-generator' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-[#E1262D] rounded-t-full"></div>
            )}
          </button>

          <button
            onClick={() => onTabChange('gallery')}
            className={`relative py-2 sm:py-3 lg:py-4 px-3 sm:px-4 lg:px-6 rounded-t-xl lg:rounded-t-2xl font-semibold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
              activeTab === 'gallery'
                ? 'bg-[#E1262D] text-white shadow-lg shadow-[#E1262D]/25'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 active:bg-gray-300 active:text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className={`p-1.5 sm:p-1.5 lg:p-2 rounded-lg ${activeTab === 'gallery' ? 'bg-white/20' : 'bg-gray-200'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-bold text-xs sm:text-sm flex items-center gap-1">
                  My Gallery
                  {!isLoggedIn && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </div>
                <div className={`text-[10px] sm:text-xs ${activeTab === 'gallery' ? 'text-white/80' : 'text-gray-400'}`}>
                  Saved Styles
                </div>
              </div>
            </div>
            {activeTab === 'gallery' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-[#E1262D] rounded-t-full"></div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TabSelector;
