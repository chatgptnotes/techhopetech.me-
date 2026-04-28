import React, { useState, useCallback, useMemo, useEffect, useRef, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Country codes with validation rules
interface CountryCode {
  code: string;
  country: string;
  flag: string;
  minDigits: number;
  maxDigits: number;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: '+91', country: 'India', flag: '\u{1F1EE}\u{1F1F3}', minDigits: 10, maxDigits: 10 },
  { code: '+1', country: 'USA', flag: '\u{1F1FA}\u{1F1F8}', minDigits: 10, maxDigits: 10 },
  { code: '+1', country: 'Canada', flag: '\u{1F1E8}\u{1F1E6}', minDigits: 10, maxDigits: 10 },
  { code: '+44', country: 'UK', flag: '\u{1F1EC}\u{1F1E7}', minDigits: 10, maxDigits: 10 },
  { code: '+971', country: 'UAE', flag: '\u{1F1E6}\u{1F1EA}', minDigits: 9, maxDigits: 9 },
  { code: '+966', country: 'Saudi Arabia', flag: '\u{1F1F8}\u{1F1E6}', minDigits: 9, maxDigits: 9 },
  { code: '+61', country: 'Australia', flag: '\u{1F1E6}\u{1F1FA}', minDigits: 9, maxDigits: 9 },
  { code: '+65', country: 'Singapore', flag: '\u{1F1F8}\u{1F1EC}', minDigits: 8, maxDigits: 8 },
  { code: '+60', country: 'Malaysia', flag: '\u{1F1F2}\u{1F1FE}', minDigits: 9, maxDigits: 10 },
  { code: '+49', country: 'Germany', flag: '\u{1F1E9}\u{1F1EA}', minDigits: 10, maxDigits: 11 },
  { code: '+33', country: 'France', flag: '\u{1F1EB}\u{1F1F7}', minDigits: 9, maxDigits: 9 },
  { code: '+39', country: 'Italy', flag: '\u{1F1EE}\u{1F1F9}', minDigits: 10, maxDigits: 10 },
  { code: '+34', country: 'Spain', flag: '\u{1F1EA}\u{1F1F8}', minDigits: 9, maxDigits: 9 },
  { code: '+31', country: 'Netherlands', flag: '\u{1F1F3}\u{1F1F1}', minDigits: 9, maxDigits: 9 },
  { code: '+55', country: 'Brazil', flag: '\u{1F1E7}\u{1F1F7}', minDigits: 10, maxDigits: 11 },
  { code: '+52', country: 'Mexico', flag: '\u{1F1F2}\u{1F1FD}', minDigits: 10, maxDigits: 10 },
  { code: '+81', country: 'Japan', flag: '\u{1F1EF}\u{1F1F5}', minDigits: 10, maxDigits: 10 },
  { code: '+82', country: 'South Korea', flag: '\u{1F1F0}\u{1F1F7}', minDigits: 9, maxDigits: 10 },
  { code: '+86', country: 'China', flag: '\u{1F1E8}\u{1F1F3}', minDigits: 11, maxDigits: 11 },
  { code: '+852', country: 'Hong Kong', flag: '\u{1F1ED}\u{1F1F0}', minDigits: 8, maxDigits: 8 },
  { code: '+63', country: 'Philippines', flag: '\u{1F1F5}\u{1F1ED}', minDigits: 10, maxDigits: 10 },
  { code: '+62', country: 'Indonesia', flag: '\u{1F1EE}\u{1F1E9}', minDigits: 10, maxDigits: 12 },
  { code: '+66', country: 'Thailand', flag: '\u{1F1F9}\u{1F1ED}', minDigits: 9, maxDigits: 9 },
  { code: '+27', country: 'South Africa', flag: '\u{1F1FF}\u{1F1E6}', minDigits: 9, maxDigits: 9 },
  { code: '+234', country: 'Nigeria', flag: '\u{1F1F3}\u{1F1EC}', minDigits: 10, maxDigits: 10 },
  { code: '+254', country: 'Kenya', flag: '\u{1F1F0}\u{1F1EA}', minDigits: 9, maxDigits: 9 },
  { code: '+92', country: 'Pakistan', flag: '\u{1F1F5}\u{1F1F0}', minDigits: 10, maxDigits: 10 },
  { code: '+880', country: 'Bangladesh', flag: '\u{1F1E7}\u{1F1E9}', minDigits: 10, maxDigits: 10 },
];

type AuthStep =
  | 'google-signin'  // Show Google button
  | 'user-details'   // Name + Location form (for all users)
  | 'loading'        // Processing
  | 'success'        // Success state (brief)
  | 'pending-approval'; // Account pending admin approval

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  usageCount: number;
  reason?: 'limit' | 'download' | 'share';
  mode?: 'signin' | 'signup';
  onAuthSuccess?: (userData: any) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  usageCount,
  reason = 'limit',
  mode = 'signup',
  onAuthSuccess,
}) => {
  const navigate = useNavigate();
  const {
    authenticateWithGoogle,
    completeProfile,
    updateProfileById,
    setUserLoggedIn,
    oauthAccessToken,
    clearOAuthToken,
  } = useAuth();

  const [step, setStep] = useState<AuthStep>('google-signin');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  // Store Google user info temporarily
  const [googleUserInfo, setGoogleUserInfo] = useState<{
    email: string;
    firstName: string;
    lastName: string;
  } | null>(null);

  // Store existing user data for pre-populating form
  const [existingUserData, setExistingUserData] = useState<any>(null);

  // User details form fields
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [countryCode, setCountryCode] = useState<CountryCode>(COUNTRY_CODES[0]); // Default to India
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Reset state when modal opens/closes
  const resetState = useCallback(() => {
    setStep('google-signin');
    setIsLoading(false);
    setError(null);
    setIsNewUser(false);
    setGoogleUserInfo(null);
    setExistingUserData(null);
    setName('');
    setLocation('');
    setCountryCode(COUNTRY_CODES[0]);
    setPhoneNumber('');
    setPhoneError(null);
    setIsDropdownOpen(false);
    setCountrySearch('');
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    clearOAuthToken();
    onClose();
  }, [resetState, clearOAuthToken, onClose]);

  // Auto-process OAuth redirect token when modal opens with a token available
  useEffect(() => {
    console.log('[AuthModal] Effect check:', { isOpen, hasToken: !!oauthAccessToken, step });
    if (isOpen && oauthAccessToken && step === 'google-signin') {
      console.log('[AuthModal] Auto-processing OAuth token');
      handleGoogleTokenSuccess(oauthAccessToken);
      clearOAuthToken();
    }
  }, [isOpen, oauthAccessToken, step]); // eslint-disable-line react-hooks/exhaustive-deps

  // ARIA dialog: refs and ids for focus trap and labelling
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  // Escape to close + focus trap while modal is open
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const getFocusable = (): HTMLElement[] => {
      const root = dialogRef.current;
      if (!root) return [];
      const selector =
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
      );
    };

    // Move focus into the dialog on open
    requestAnimationFrame(() => {
      const focusables = getFocusable();
      if (focusables.length > 0) {
        focusables[0].focus();
      } else {
        dialogRef.current?.focus();
      }
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusables = getFocusable();
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previously focused element on close
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen, handleClose]);

  // Google OAuth - Redirect to Google for authentication (no popup needed)
  const handleGoogleRedirect = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = window.location.origin;
    const scope = 'email profile';

    // Store current path and auth reason so we can restore after redirect
    sessionStorage.setItem('headz_oauth_redirect', JSON.stringify({
      returnPath: window.location.pathname,
      reason,
      mode,
    }));

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&prompt=select_account`;

    window.location.href = googleAuthUrl;
  };

  // Google OAuth - Handle access token (called from OAuth callback or local popup)
  const handleGoogleTokenSuccess = async (accessToken: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const { googleUserInfo: gUserInfo, existingUser, isNewUser: newUser, error: authError } = await authenticateWithGoogle(
        accessToken
      );

      if (authError) {
        if (authError.message?.includes('blocked')) {
          setError('Your account has been blocked. Please contact support.');
        } else if (authError.message?.includes('pending')) {
          setStep('pending-approval');
          setIsLoading(false);
          return;
        } else {
          setError(authError.message || 'Failed to sign in with Google. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      if (!gUserInfo) {
        setError('Failed to get user information from Google.');
        setIsLoading(false);
        return;
      }

      // SIGN IN mode: existing users only, log in directly
      if (mode === 'signin') {
        if (newUser || !existingUser) {
          setError('No account found. Please sign up first.');
          setIsLoading(false);
          return;
        }
        // Log in directly
        setUserLoggedIn(existingUser);
        setStep('success');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(existingUser);
          handleClose();
        }, 500);
        setIsLoading(false);
        return;
      }

      // SIGN UP mode: show details form for both new and existing users
      setGoogleUserInfo(gUserInfo);
      setIsNewUser(newUser);

      if (newUser) {
        setName('');
        setLocation('');
        setPhoneNumber('');
        setCountryCode(COUNTRY_CODES[0]);
        setExistingUserData(null);
      } else if (existingUser) {
        // Already has account - log in directly instead of showing form again
        setUserLoggedIn(existingUser);
        setStep('success');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(existingUser);
          handleClose();
        }, 500);
        setIsLoading(false);
        return;
      }

      setStep('user-details');
    } catch (err: any) {
      setError('Failed to sign in with Google. Please try again.');
    }

    setIsLoading(false);
  };


  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    if (!countrySearch.trim()) return COUNTRY_CODES;
    const search = countrySearch.toLowerCase();
    return COUNTRY_CODES.filter(
      c => c.country.toLowerCase().includes(search) || c.code.includes(search)
    );
  }, [countrySearch]);

  // Validate phone number based on selected country
  const validatePhoneNumber = useCallback((phone: string, country: CountryCode): string | null => {
    const digitsOnly = phone.replace(/\D/g, '');

    if (!digitsOnly) {
      return 'Phone number is required';
    }

    if (digitsOnly.length < country.minDigits) {
      return `Phone number must be at least ${country.minDigits} digits for ${country.country}`;
    }

    if (digitsOnly.length > country.maxDigits) {
      return `Phone number must be at most ${country.maxDigits} digits for ${country.country}`;
    }

    return null;
  }, []);

  // Handle phone number change - only allow digits
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    // Limit to max digits for selected country
    const limitedValue = value.slice(0, countryCode.maxDigits);
    setPhoneNumber(limitedValue);
    // Clear error when user starts typing
    if (phoneError) {
      setPhoneError(null);
    }
  };

  // Handle country selection
  const handleCountrySelect = (country: CountryCode) => {
    setCountryCode(country);
    setIsDropdownOpen(false);
    setCountrySearch('');
    // Truncate phone number if it exceeds new country's max digits
    if (phoneNumber && phoneNumber.length > country.maxDigits) {
      setPhoneNumber(phoneNumber.slice(0, country.maxDigits));
      setPhoneError(null);
    } else if (phoneNumber) {
      // Re-validate if phone number exists but wasn't truncated
      const error = validatePhoneNumber(phoneNumber, country);
      setPhoneError(error);
    }
  };

  // Handle user details form submission
  const handleUserDetailsSubmit = async () => {
    setError(null);
    setPhoneError(null);

    // Validate name is not empty for new users
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    // Validate phone number
    const phoneValidationError = validatePhoneNumber(phoneNumber, countryCode);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      return;
    }

    setIsLoading(true);

    try {
      if (isNewUser && googleUserInfo) {
        // New user - create user with name, location, and phone
        // Parse name into first and last name
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const result = await completeProfile(
          googleUserInfo.email,
          firstName,
          lastName,
          location.trim() || undefined,
          'google',
          countryCode.code,
          phoneNumber
        );

        if (result.error) {
          setError(result.error?.message || 'Failed to create profile');
          setIsLoading(false);
          return;
        }

        // Check if user is pending approval
        if (result.pendingApproval) {
          setStep('pending-approval');
          setIsLoading(false);
          return;
        }

        if (result.user) {
          // Check if user is a super admin and redirect accordingly
          if (result.user.is_super_admin) {
            setUserLoggedIn(result.user);
            navigate('/super-admin');
            handleClose();
            return;
          }

          setUserLoggedIn(result.user);
          setStep('success');
          setTimeout(() => {
            if (onAuthSuccess) onAuthSuccess(result.user);
            handleClose();
          }, 500);
        }
      } else if (existingUserData) {
        // Existing user - update profile with name, location, and phone
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const result = await updateProfileById(
          existingUserData.id,
          firstName,
          lastName,
          location.trim() || undefined,
          countryCode.code,
          phoneNumber
        );

        if (result.error) {
          setError(result.error?.message || 'Failed to update profile');
          setIsLoading(false);
          return;
        }

        // Use the updated user data, falling back to existing data
        const userData = result.user || existingUserData;

        // Check if user is a super admin and redirect accordingly
        if (userData.is_super_admin) {
          setUserLoggedIn(userData);
          navigate('/super-admin');
          handleClose();
          return;
        }

        setUserLoggedIn(userData);
        setStep('success');
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess(userData);
          handleClose();
        }, 500);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }

    setIsLoading(false);
  };

  if (!isOpen) return null;

  // Get title based on mode and reason
  const getTitle = () => {
    if (mode === 'signin') {
      switch (reason) {
        case 'download':
          return 'Sign In to Download';
        case 'share':
          return 'Sign In to Share';
        default:
          return 'Welcome Back';
      }
    }
    // signup mode
    switch (reason) {
      case 'download':
        return 'Sign Up to Download';
      case 'share':
        return 'Sign Up to Share';
      default:
        return 'Create Account';
    }
  };

  // Get subtitle based on mode and reason
  const getSubtitle = () => {
    if (mode === 'signin') {
      return 'Sign in with your Google account to continue';
    }
    // signup mode
    switch (reason) {
      case 'download':
        return 'Create a free account to download your styled images without watermarks';
      case 'share':
        return 'Create a free account to share your transformations';
      default:
        return 'Create a free account to get started';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-md"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-in focus:outline-none"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Step: Google Sign-In */}
        {step === 'google-signin' && (
          <>
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="HEADZ HAIR FIXING APP" className="h-14 object-contain rounded-lg" />
            </div>

            {/* Title */}
            <h2 id={titleId} className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">
              {getTitle()}
            </h2>

            {/* Subtitle */}
            <p className="text-gray-500 text-center mb-6">{getSubtitle()}</p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Google Sign-In Button */}
            <button
              onClick={handleGoogleRedirect}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all shadow-md border border-gray-200 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
            </button>

            {/* Maybe Later */}
            <button
              onClick={handleClose}
              className="w-full text-center text-gray-500 hover:text-gray-600 text-sm mt-4 transition-colors"
            >
              Maybe later
            </button>
          </>
        )}

        {/* Step: User Details Form */}
        {step === 'user-details' && (
          <>
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img src="/logo.png" alt="HEADZ HAIR FIXING APP" className="h-14 object-contain rounded-lg" />
            </div>

            {/* Title */}
            <h2 id={titleId} className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">
              Complete Your Profile
            </h2>

            {/* Subtitle */}
            <p className="text-gray-500 text-center mb-6">
              Add your details to get started
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Name <span className="text-[#E1262D]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E1262D] focus:border-transparent transition-all"
                  disabled={isLoading}
                />
              </div>

              {/* Phone Number Field */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Phone Number <span className="text-[#E1262D]">*</span>
                </label>
                <div className="flex gap-2">
                  {/* Country Code Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-1 px-3 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E1262D] focus:border-transparent transition-all min-w-[110px] justify-between"
                      disabled={isLoading}
                    >
                      <span className="flex items-center gap-1">
                        <span>{countryCode.flag}</span>
                        <span className="text-sm">{countryCode.code}</span>
                      </span>
                      <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-hidden">
                        {/* Search Input */}
                        <div className="p-2 border-b border-gray-200">
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={(e) => setCountrySearch(e.target.value)}
                            placeholder="Search country..."
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E1262D] text-sm"
                            autoFocus
                          />
                        </div>
                        {/* Country List */}
                        <div className="max-h-44 overflow-y-auto">
                          {filteredCountries.map((country, index) => (
                            <button
                              key={`${country.code}-${country.country}-${index}`}
                              type="button"
                              onClick={() => handleCountrySelect(country)}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 transition-colors ${
                                countryCode.code === country.code && countryCode.country === country.country
                                  ? 'bg-gray-100'
                                  : ''
                              }`}
                            >
                              <span>{country.flag}</span>
                              <span className="text-gray-900 text-sm flex-1">{country.country}</span>
                              <span className="text-gray-500 text-sm">{country.code}</span>
                            </button>
                          ))}
                          {filteredCountries.length === 0 && (
                            <div className="px-3 py-2 text-gray-500 text-sm">No countries found</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phone Number Input */}
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    placeholder="Enter phone number"
                    className={`flex-1 px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E1262D] focus:border-transparent transition-all ${
                      phoneError ? 'border-[#E1262D]' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {/* Phone Validation Error */}
                {phoneError && (
                  <p className="mt-1 text-sm text-[#E1262D]">{phoneError}</p>
                )}
                {/* Digit hint */}
                {!phoneError && phoneNumber && (
                  <p className="mt-1 text-xs text-gray-500">
                    {countryCode.minDigits === countryCode.maxDigits
                      ? `${countryCode.country} requires ${countryCode.minDigits} digits`
                      : `${countryCode.country} requires ${countryCode.minDigits}-${countryCode.maxDigits} digits`}
                    {' '}({phoneNumber.length} entered)
                  </p>
                )}
              </div>

              {/* Location Field */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Location <span className="text-gray-500">(optional)</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter your location"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E1262D] focus:border-transparent transition-all"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleUserDetailsSubmit}
              disabled={isLoading || !name.trim() || !phoneNumber.trim()}
              className="w-full mt-6 px-6 py-3.5 bg-[#E1262D] hover:bg-[#B91C1C] text-white font-medium rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Continue'
              )}
            </button>
          </>
        )}

        {/* Step: Loading */}
        {step === 'loading' && (
          <div className="py-12 flex flex-col items-center justify-center">
            <svg className="animate-spin h-12 w-12 text-[#E1262D] mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p id={titleId} className="text-gray-500">Please wait...</p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 id={titleId} className="text-xl font-bold text-gray-900 mb-2">Welcome!</h3>
            <p className="text-gray-500">You're all set.</p>
          </div>
        )}

        {/* Step: Pending Approval - KEPT YELLOW for functional exception */}
        {step === 'pending-approval' && (
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 id={titleId} className="text-xl font-bold text-gray-900 mb-2">Account Pending Approval</h3>
            <p className="text-gray-500 text-center mb-6">
              Your account has been created successfully. An admin will review and approve your request shortly.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white font-medium rounded-xl transition-all shadow-md"
            >
              OK, Got It
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
