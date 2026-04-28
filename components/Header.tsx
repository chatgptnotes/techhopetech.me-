import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

  const handleLogout = async () => {
    await signOut();
  };

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <>
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img src="/logo.png" alt="" aria-hidden="true" className="h-20 sm:h-32 sm:-my-9 object-contain rounded-lg flex-shrink-0" />
            <span className="hidden sm:inline text-xl font-bold text-[#E1262D]">
              HEADZ HAIR FIXING APP
            </span>
          </Link>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-gray-900 text-sm hidden sm:inline">
                Hi, <span className="font-semibold text-[#E1262D]">{user.first_name || user.email}</span>
              </span>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-2 text-sm bg-[#E1262D] hover:bg-[#B91C1C] text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => openAuth('signin')}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => openAuth('signup')}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[#E1262D] hover:bg-[#B91C1C] text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </header>

      {!user && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          usageCount={0}
          reason="limit"
          mode={authMode}
        />
      )}
    </>
  );
};

export default Header;
