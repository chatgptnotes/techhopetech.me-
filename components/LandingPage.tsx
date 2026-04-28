import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import { useDocumentMeta } from '../utils/useDocumentMeta';

const FAQ_ITEMS: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: 'Is HEADZ Hair Fixing App free to use?',
    a: 'Yes. You can upload a photo and try on hundreds of hairstyles for free. A Google sign-in is only required if you want to download your generated image without a watermark.',
  },
  {
    q: 'Do I need to create an account or password?',
    a: 'No password is needed. We use Google Sign-In for authentication, so you log in with your existing Google account.',
  },
  {
    q: 'What happens to the photos I upload?',
    a: 'Photos are processed to generate your virtual hairstyle and are deleted automatically within 24 hours. We do not sell or share your photos with third parties.',
  },
  {
    q: 'How accurate are the AI hairstyle previews?',
    a: 'Results are designed to be realistic previews, but actual styling will depend on your hair type, length, and texture. We recommend speaking with a professional stylist before any major change.',
  },
  {
    q: 'What kind of photo should I upload?',
    a: 'A clear, front-facing photo with good lighting works best. PNG, JPG, or WEBP files up to 10MB are supported.',
  },
];

const LandingPage: React.FC = () => {
  useDocumentMeta({
    title: 'HEADZ Hair Fixing App - Try Any Hairstyle Before You Cut',
    description:
      'Upload your photo and see yourself with hundreds of AI-generated hairstyles instantly. Try free; sign in with Google to download your final look.',
    path: '/',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'HEADZ Hair Fixing App',
        url: 'https://headz.international/',
        description:
          'AI-powered virtual hairstyle try-on. Upload your photo and instantly see yourself with new hairstyles.',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: a,
          },
        })),
      },
    ],
  });

  const { user, signOut, oauthAccessToken } = useAuth();
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
      console.log('[LandingPage] Opening auth modal from OAuth redirect');
      setShowAuthModal(true);
    }
  }, [oauthAccessToken, user]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleLogout = async () => {
    await signOut();
  };

  // Before/After image pairs - user will add their images to /public/landing/
  const transformations: Array<{
    before: string;
    after: string;
    beforeAlt: string;
    afterAlt: string;
  }> = [
    {
      before: '/landing/Before1.JPG',
      after: '/landing/After1.JPG',
      beforeAlt: 'Customer photo before HEADZ hair fixing — thinning hair on the crown',
      afterAlt: 'Same customer after HEADZ hair fixing — full natural-looking hairline',
    },
    {
      before: '/landing/Before2.jpg',
      after: '/landing/After2.JPG',
      beforeAlt: 'Customer photo before HEADZ hair fixing — receding front hairline',
      afterAlt: 'Same customer after HEADZ hair fixing — restored front hairline with dense styled hair',
    },
    {
      before: '/landing/Before3.JPG',
      after: '/landing/After3.JPG',
      beforeAlt: 'Customer photo before HEADZ hair fixing — bald top with patchy sides',
      afterAlt: 'Same customer after HEADZ hair fixing — full styled hairstyle covering the crown',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <img src="/logo.png" alt="" aria-hidden="true" decoding="async" className="h-10 sm:h-14 object-contain flex-shrink-0" />
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

      <main id="main-content" tabIndex={-1}>
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
            AI-powered. Free to try — sign in with Google to download your result.
          </p>
          <Link
            to="/app"
            className="inline-block px-8 py-4 bg-[#E1262D] hover:bg-[#B91C1C] rounded-full text-lg font-semibold text-white transition-all duration-300 transform hover:scale-105"
          >
            Try It Free
          </Link>

          {/* Social proof / trust signals */}
          <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-gray-500">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E1262D]" aria-hidden="true" />
              Free to try, no credit card
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E1262D]" aria-hidden="true" />
              Secure Google Sign-In
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E1262D]" aria-hidden="true" />
              Photos auto-deleted within 24 hours
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E1262D]" aria-hidden="true" />
              Hundreds of preset hairstyles
            </li>
          </ul>
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
                    alt={item.beforeAlt}
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
                    alt={item.afterAlt}
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

      {/* How It Works - 3-step explainer */}
      <section className="py-20 px-4 sm:px-6 bg-white" aria-labelledby="how-it-works-heading">
        <div className="max-w-5xl mx-auto">
          <h2 id="how-it-works-heading" className="text-2xl sm:text-3xl font-bold text-center mb-3 text-gray-900">
            See How It Works
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            From photo to a new look in under a minute. No app to install.
          </p>

          <ol className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 list-none">
            {[
              {
                step: '1',
                title: 'Upload your photo',
                desc: 'Drop in a clear front-facing photo, or take one with your camera.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 12V4m0 0L8 8m4-4l4 4" />
                ),
              },
              {
                step: '2',
                title: 'Choose a hairstyle',
                desc: 'Pick from hundreds of styles, or describe your own with AI prompts.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ),
              },
              {
                step: '3',
                title: 'Download your look',
                desc: 'Preview instantly, then sign in with Google to download a clean copy.',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0 0l-4-4m4 4l4-4" />
                ),
              },
            ].map((item) => (
              <li
                key={item.step}
                className="relative bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8 text-center"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#E1262D] text-white text-lg font-bold flex items-center justify-center shadow-md">
                  {item.step}
                </div>
                <div className="mx-auto mt-4 mb-4 w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-[#E1262D]">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {item.icon}
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{item.desc}</p>
              </li>
            ))}
          </ol>

          <div className="text-center mt-12">
            <Link
              to="/app"
              className="inline-block px-8 py-3 bg-[#E1262D] hover:bg-[#B91C1C] rounded-full text-base font-semibold text-white transition-all duration-300 transform hover:scale-105"
            >
              Try It Free
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 bg-white" aria-labelledby="faq-heading">
        <div className="max-w-3xl mx-auto">
          <h2 id="faq-heading" className="text-2xl sm:text-3xl font-bold text-center mb-3 text-gray-900">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-gray-600 mb-10">
            Quick answers about how HEADZ works, sign-in, and your photos.
          </p>
          <div className="divide-y divide-gray-200 border border-gray-200 rounded-2xl bg-white">
            {FAQ_ITEMS.map(({ q, a }) => (
              <details key={q} className="group p-5 sm:p-6">
                <summary className="flex justify-between items-center cursor-pointer list-none gap-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">{q}</h3>
                  <span className="text-[#E1262D] text-2xl leading-none transition-transform group-open:rotate-45" aria-hidden="true">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">{a}</p>
              </details>
            ))}
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
            Try it free. A quick Google sign-in is only needed to download your final result.
          </p>
          <Link
            to="/app"
            className="inline-block px-10 py-4 bg-[#E1262D] hover:bg-[#B91C1C] text-white rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105"
          >
            Get Started Free
          </Link>
        </div>
      </section>

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
