import React from 'react';

function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#E1262D] focus:text-white focus:rounded-lg focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-4 focus:ring-[#E1262D]/30"
    >
      Skip to main content
    </a>
  );
}

export default SkipToContent;
