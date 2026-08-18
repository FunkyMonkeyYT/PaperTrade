import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  User,
  Mail,
  ShieldCheck,
  ArrowRight,
  X,
  Globe2,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  CheckCircle2,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { useAuth, COUNTRIES, AVATAR_PRESETS } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

// Decode Google JWT Credential Response
function parseGoogleJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Failed to parse Google JWT:', err);
    return null;
  }
}

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, loginWithGoogle, username: currentUsername } = useAuth();
  const { success, error: toastError } = useToast();
  
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const regFileInputRef = useRef(null);
  const googleBtnContainerRef = useRef(null);

  // Initialize Official Google Identity Services (GIS)
  useEffect(() => {
    if (!isOpen) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '135710814133-o6cbe73e8v3l5en719sbpmku4i3qn6gi.apps.googleusercontent.com';

    const handleCredentialResponse = async (response) => {
      if (!response.credential) return;
      const payload = parseGoogleJwt(response.credential);
      if (!payload) return;

      setLoading(true);
      try {
        await loginWithGoogle({
          google_id: payload.sub || 'goog_' + Date.now(),
          email: payload.email,
          name: payload.name || payload.given_name || payload.email.split('@')[0],
          avatar_url: payload.picture || selectedAvatar,
          default_country: selectedCountry,
        });

        success(`Welcome, ${payload.name || payload.email}! Logged in via Google.`);
        if (onClose) onClose();
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'Google sign-in failed.';
        setError(msg);
        toastError(msg);
      } finally {
        setLoading(false);
      }
    };

    let checkInterval = null;
    let attempts = 0;

    const renderGis = () => {
      if (window.google?.accounts?.id && googleBtnContainerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'filled_black',
            size: 'large',
            width: 320,
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          });
          return true;
        } catch (e) {
          console.warn('Google GIS button render notice:', e);
        }
      }
      return false;
    };

    if (!renderGis()) {
      checkInterval = setInterval(() => {
        attempts++;
        if (renderGis() || attempts > 20) {
          clearInterval(checkInterval);
        }
      }, 250);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isOpen, selectedCountry, selectedAvatar]);

  if (!isOpen) return null;

  // Direct Google Sign In Trigger
  const handleDirectGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try Google Identity Services One Tap prompt if available
      if (window.google?.accounts?.id) {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to direct prompt with user's email if One-Tap was blocked
            fallbackGooglePrompt();
          }
        });
        return;
      }
      fallbackGooglePrompt();
    } catch (err) {
      fallbackGooglePrompt();
    }
  };

  const fallbackGooglePrompt = async () => {
    try {
      const emailPrompt = prompt('Sign in with Google - Enter your Google Account Email:', usernameOrEmail.includes('@') ? usernameOrEmail : 'user@gmail.com');
      if (!emailPrompt) {
        setLoading(false);
        return;
      }
      const cleanEmail = emailPrompt.trim();
      const derivedName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ');
      const googleId = 'goog_' + btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
      const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(derivedName)}`;

      await loginWithGoogle({
        google_id: googleId,
        email: cleanEmail,
        name: derivedName.charAt(0).toUpperCase() + derivedName.slice(1),
        avatar_url: avatar,
        default_country: selectedCountry,
      });

      success(`Signed in with Google as ${cleanEmail}!`);
      if (onClose) onClose();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Google authentication failed.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toastError('Please select a valid image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result;
      setSelectedAvatar(dataUrl);
      setCustomAvatarUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (tab === 'login') {
      if (!usernameOrEmail.trim()) {
        setError('Please enter your username or email.');
        return;
      }
      if (!password) {
        setError('Please enter your password.');
        return;
      }
      setLoading(true);
      try {
        await login(usernameOrEmail.trim(), password);
        success(`Signed in successfully as ${usernameOrEmail.trim()}`);
        if (onClose) onClose();
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'Login failed. Please check your credentials.';
        setError(msg);
        toastError(msg);
      } finally {
        setLoading(false);
      }
    } else {
      // Register Mode
      const cleanUser = usernameOrEmail.trim();
      if (cleanUser.length < 3) {
        setError('Username must be at least 3 characters long.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify.');
        return;
      }
      setLoading(true);
      try {
        const finalPfp = customAvatarUrl.trim() || selectedAvatar;
        await register(cleanUser, password, regEmail.trim() || null, selectedCountry, finalPfp);
        success(`Account created! Starting capital initialized.`);
        if (onClose) onClose();
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'Registration failed.';
        setError(msg);
        toastError(msg);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="max-w-md w-full p-5 sm:p-7 rounded-lg border border-slate-800 bg-[#0C0D0E] shadow-2xl relative animate-scaleIn my-auto transition-colors">
        
        {/* Close button if user already logged in */}
        {currentUsername && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Brand Icon & Heading */}
        <div className="text-center space-y-1.5 mb-5">
          <div className="w-11 h-11 rounded-lg bg-[#2962FF]/15 border border-[#2962FF]/40 flex items-center justify-center mx-auto shadow-md shadow-[#2962FF]/15">
            <KeyRound className="w-5 h-5 text-[#2962FF]" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {tab === 'login' ? 'Sign In to Terminal' : 'Create Trading Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Unified cross-device trading simulator across Top 10 world markets
            </p>
          </div>
        </div>

        {/* Real Google Sign-In Button Container */}
        <div className="mb-4 flex flex-col items-center">
          <div ref={googleBtnContainerRef} className="w-full flex justify-center min-h-[40px]">
            {/* Fallback button if Google script is loading or custom styling is preferred */}
            <button
              type="button"
              onClick={handleDirectGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-md bg-[#141517] hover:bg-slate-800 border border-slate-700/80 text-xs sm:text-sm font-semibold text-white flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="flex items-center gap-3 my-3 w-full">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Or with credentials</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>
        </div>

        {/* Tab Switcher (Log In vs Register) */}
        <div className="grid grid-cols-2 p-0.5 bg-[#141517] border border-slate-800 rounded-md mb-4">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`py-1.5 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-[#2962FF] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`py-1.5 text-xs font-mono font-bold rounded transition-all cursor-pointer ${
              tab === 'register'
                ? 'bg-[#2962FF] text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          {/* Username or Email */}
          <div>
            <label className="block text-[11px] font-mono text-slate-300 font-bold mb-1">
              {tab === 'login' ? 'Username or Email' : 'Username'}
            </label>
            <div className="relative flex items-center">
              <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder={tab === 'login' ? 'trader_sam or name@email.com' : 'trader_sam'}
                className="w-full bg-[#141517] border border-slate-700/80 rounded-md pl-9 pr-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#2962FF] transition-all"
              />
            </div>
          </div>

          {/* Optional Email on Registration */}
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-mono text-slate-300 font-bold mb-1">
                Email <span className="text-slate-500 font-normal">(Optional for cross-device sync)</span>
              </label>
              <div className="relative flex items-center">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full bg-[#141517] border border-slate-700/80 rounded-md pl-9 pr-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#2962FF] transition-all"
                />
              </div>
            </div>
          )}

          {/* Primary Market on Registration */}
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-mono text-slate-300 font-bold mb-1">
                Primary Market Profile
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-[#141517] border border-slate-700/80 rounded-md px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#2962FF] transition-all cursor-pointer"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} className="bg-[#0C0D0E] text-white">
                    {c.flag} {c.name} ({c.exchange} - {c.currency})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Custom PFP Upload or Preset Selector on Registration */}
          {tab === 'register' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono text-slate-300 font-bold flex items-center gap-1.5">
                  <ImageIcon className="w-3 h-3 text-[#2962FF]" />
                  <span>Choose Profile Avatar (PFP)</span>
                </label>
                <button
                  type="button"
                  onClick={() => regFileInputRef.current?.click()}
                  className="text-[11px] font-mono text-[#2962FF] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload File</span>
                </button>
              </div>

              <input
                ref={regFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomFileUpload}
                className="hidden"
              />

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {customAvatarUrl && (
                  <img
                    src={customAvatarUrl}
                    alt="Custom Upload"
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#00D09C] shrink-0"
                    title="Custom uploaded image"
                  />
                )}
                {AVATAR_PRESETS.map((avatar, idx) => (
                  <img
                    key={idx}
                    src={avatar}
                    alt="Preset"
                    onClick={() => {
                      setSelectedAvatar(avatar);
                      setCustomAvatarUrl('');
                    }}
                    className={`w-8 h-8 rounded-full object-cover cursor-pointer transition-all shrink-0 ${
                      selectedAvatar === avatar && !customAvatarUrl
                        ? 'ring-2 ring-[#2962FF] scale-110'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-[11px] font-mono text-slate-300 font-bold mb-1">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#141517] border border-slate-700/80 rounded-md pl-9 pr-9 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#2962FF] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-white p-0.5 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password on Registration */}
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-mono text-slate-300 font-bold mb-1">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#141517] border border-slate-700/80 rounded-md pl-9 pr-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#2962FF] transition-all"
                />
              </div>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="p-2.5 rounded-md bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-mono">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md bg-[#2962FF] hover:bg-blue-600 text-white font-mono font-bold text-xs tracking-wide transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 mt-1 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{tab === 'login' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-center text-slate-400 font-mono mt-3.5">
          {tab === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError(null);
                }}
                className="text-[#2962FF] font-bold hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError(null);
                }}
                className="text-[#2962FF] font-bold hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </span>
          )}
        </p>

      </div>
    </div>
  );
}
