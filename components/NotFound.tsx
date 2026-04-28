import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../utils/useDocumentMeta';

function NotFound() {
  useDocumentMeta({
    title: 'Page Not Found - HEADZ Hair Fixing App',
    description: 'The page you are looking for does not exist. Return to HEADZ Hair Fixing App home.',
    path: '/404',
  });

  // 404 should not be indexed
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-1 sm:gap-2 min-w-0">
            <img src="/logo.png" alt="" aria-hidden="true" decoding="async" className="h-10 sm:h-14 object-contain flex-shrink-0" />
            <span className="hidden sm:inline text-xl font-bold text-[#E1262D]">
              HEADZ HAIR FIXING APP
            </span>
          </Link>
        </div>
      </nav>

      {/* Main */}
      <main id="main-content" tabIndex={-1} className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-24 pb-16">
        <div className="max-w-xl text-center">
          <p className="text-7xl sm:text-8xl font-bold text-[#E1262D] mb-4">404</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            The page you&apos;re looking for doesn&apos;t exist or may have moved. Let&apos;s get you back on track.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-block px-8 py-4 bg-[#E1262D] hover:bg-[#B91C1C] rounded-full text-base font-semibold text-white transition-all duration-300 transform hover:scale-105"
            >
              Go back home
            </Link>
            <Link
              to="/app"
              className="inline-block px-8 py-4 bg-gray-100 hover:bg-gray-200 rounded-full text-base font-semibold text-gray-900 transition-all duration-300 border border-gray-200"
            >
              Open the app
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" aria-hidden="true" loading="lazy" decoding="async" className="h-10 sm:h-14 object-contain" />
            <span className="text-sm sm:text-lg font-bold text-[#E1262D]">
              HEADZ HAIR FIXING APP
            </span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default NotFound;
