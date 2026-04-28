import React from 'react';
import { Link, NavLink } from 'react-router-dom';

function LegalNav() {
  const linkBase =
    'px-3 sm:px-4 py-2 text-xs sm:text-sm transition-colors';
  return (
    <nav
      aria-label="Main"
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200"
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-4 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-1 sm:gap-2 min-w-0">
          <img src="/logo.png" alt="" aria-hidden="true" className="h-10 sm:h-14 object-contain flex-shrink-0" />
          <span className="hidden sm:inline text-xl font-bold text-[#E1262D]">
            HEADZ HAIR FIXING APP
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900'}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/app"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900'}`
            }
          >
            Try the App
          </NavLink>
          <NavLink
            to="/privacy"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900'}`
            }
          >
            Privacy
          </NavLink>
          <NavLink
            to="/terms"
            className={({ isActive }) =>
              `${linkBase} ${isActive ? 'text-gray-900 font-semibold' : 'text-gray-600 hover:text-gray-900'}`
            }
          >
            Terms
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default LegalNav;
