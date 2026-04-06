import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

const LandingPage: React.FC = () => {
  const { user, signOut, oauthAccessToken } = useAuth();
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  // Auto-open auth modal when returning from Google OAuth redirect
  useEffect(() => {
    if (oauthAccessToken && !user) {
      const stored = sessionStorage.getItem('headz_oauth_redirect');
      if (stored) {
        const { mode } = JSON.parse(stored);
        setAuthMode(mode || 'signup');
      }
      setShowAuthModal(true);
    }
  }, [oauthAccessToken, user]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleLogout = async () => {
    await signOut();
  };

  // Before/After image pairs - user will add their images to /public/landing/
  const transformations = [
    { before: '/landing/Before1.JPG', after: '/landing/After1.JPG' },
    { before: '/landing/Before2.jpg', after: '/landing/After2.JPG' },
    { before: '/landing/Before3.JPG', after: '/landing/After3.JPG' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <img src="/logo.png" alt="HEADZ" className="h-10 sm:h-14 object-contain flex-shrink-0" />
            <span className="hidden sm:inline text-xl font-bold text-[#E1262D]">
              HEADZ HAIR FIXING APP
            </span>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {user ? (
              <>
                <span className="text-gray-900 text-sm hidden sm:block">
                  Hi, <span className="font-semibold text-[#E1262D]">{user.first_name || user.email}</span>
                </span>
                <Link
                  to="/app"
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-colors border border-gray-200"
                >
                  Open App
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[#E1262D] hover:bg-[#B91C1C] text-white font-medium rounded-lg transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setAuthMode('signin'); setShowAuthModal(true); }}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { setAuthMode('signup'); setShowAuthModal(true); }}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[#E1262D] hover:bg-[#B91C1C] text-white font-medium rounded-lg transition-all"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight text-gray-900">
            Try Any Hairstyle
            <span className="block text-[#E1262D]">
              Before You Cut
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Upload your photo and see yourself with hundreds of hairstyles instantly.
            AI-powered. Free to try.
          </p>
          <Link
            to="/app"
            className="inline-block px-8 py-4 bg-[#E1262D] hover:bg-[#B91C1C] rounded-full text-lg font-semibold text-white transition-all duration-300 transform hover:scale-105"
          >
            Try It Free
          </Link>
        </div>
      </section>

      {/* Before/After Gallery */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-gray-900">
            Real Transformations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {transformations.map((item, index) => (
              <div key={index} className="group">
                <div
                  className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer"
                  onClick={() => setActiveIndex(activeIndex === index ? null : index)}
                >
                  {/* Before Image */}
                  <img
                    src={item.before}
                    alt={`Before transformation ${index + 1}`}
                    loading="lazy"
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0 ${activeIndex === index ? 'opacity-0' : ''}`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                      const placeholder = document.createElement('div');
                      placeholder.className = 'text-gray-400 text-center p-4';
                      placeholder.innerHTML = `<div class="text-4xl mb-2">+</div><div class="text-sm">Add before-${index + 1}.jpg</div>`;
                      target.parentElement?.appendChild(placeholder);
                    }}
                  />
                  {/* After Image */}
                  <img
                    src={item.after}
                    alt={`After transformation ${index + 1}`}
                    loading="lazy"
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-100 ${activeIndex === index ? 'opacity-100' : 'opacity-0'}`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  {/* Labels */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between">
                    <span className={`px-3 py-1 bg-white/80 text-gray-900 rounded-full text-xs font-medium transition-opacity duration-500 group-hover:opacity-0 ${activeIndex === index ? 'opacity-0' : ''}`}>
                      Before
                    </span>
                    <span className={`px-3 py-1 bg-[#E1262D] text-white rounded-full text-xs font-medium transition-opacity duration-500 group-hover:opacity-100 ${activeIndex === index ? 'opacity-100' : 'opacity-0'}`}>
                      After
                    </span>
                  </div>
                </div>
                <p className="text-center text-gray-500 text-sm mt-3">Tap or hover to see result</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-gray-900">
            See How It Works
          </h2>

          <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
            {!videoPlaying ? (
              <>
                {/* Video Thumbnail / Placeholder */}
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                  <video
                    src="/landing/demo.mp4"
                    className="absolute inset-0 w-full h-full object-cover"
                    muted
                    playsInline
                    onError={(e) => {
                      const target = e.target as HTMLVideoElement;
                      target.style.display = 'none';
                    }}
                  />
                  <button
                    onClick={() => setVideoPlaying(true)}
                    className="relative z-10 w-20 h-20 bg-[#E1262D] rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                  >
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <div className="text-sm">Add demo.mp4 to /public/landing/</div>
                  </div>
                </div>
              </>
            ) : (
              <video
                src="/landing/demo.mp4"
                className="w-full h-full object-cover"
                controls
                autoPlay
                onError={() => {
                  setVideoPlaying(false);
                }}
              />
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900">
            Ready to Find Your Perfect Look?
          </h2>
          <p className="text-gray-600 mb-8">
            No signup required. Just upload a photo and start exploring.
          </p>
          <Link
            to="/app"
            className="inline-block px-10 py-4 bg-[#E1262D] hover:bg-[#B91C1C] text-white rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="HEADZ" className="h-10 sm:h-14 object-contain" />
            <span className="text-sm sm:text-lg font-bold text-[#E1262D]">
              HEADZ HAIR FIXING APP
            </span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
          </div>
          <div className="text-sm text-gray-400">
            v1.3 - Dec 2025
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        usageCount={0}
        reason="download"
        mode={authMode}
      />
    </div>
  );
};

export default LandingPage;
