import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { stockApi } from '../services/api';
import { COUNTRIES, FX_RATES, AVATAR_PRESETS } from '../constants/theme';

const AuthContext = createContext();

export { COUNTRIES, FX_RATES, AVATAR_PRESETS };

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('papertrade_access_token') || '');
  const [username, setUsername] = useState(() => localStorage.getItem('papertrade_username') || '');
  const [email, setEmail] = useState(() => localStorage.getItem('papertrade_user_email') || '');
  const [avatarUrl, setAvatarUrl] = useState(() => localStorage.getItem('papertrade_avatar_url') || '');
  const [userProfile, setUserProfile] = useState(null);
  
  const [activeCountry, setActiveCountry] = useState(() => {
    return localStorage.getItem('papertrade_country') || 'US';
  });

  const [marketProfiles, setMarketProfiles] = useState([]);
  const [marketStatus, setMarketStatus] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(false);

  // Fetch Market Profiles & Status
  const fetchMarketData = useCallback(async (countryCode) => {
    try {
      const [profiles, status] = await Promise.all([
        stockApi.getMarketProfiles().catch(() => []),
        stockApi.getMarketStatus(countryCode || activeCountry).catch(() => null)
      ]);
      if (profiles && profiles.length > 0) {
        setMarketProfiles(profiles);
      }
      if (status) {
        setMarketStatus(status);
      }
    } catch (err) {
      console.error('Market profiles fetch failed:', err);
    }
  }, [activeCountry]);

  // Sync profile on mount or token change
  const fetchProfile = useCallback(async () => {
    if (!token && !username && !email) {
      setIsAuthModalOpen(true);
      return;
    }
    setLoadingAuth(true);
    try {
      const profile = await stockApi.getProfile();
      setUserProfile(profile);
      if (profile.username) {
        setUsername(profile.username);
        localStorage.setItem('papertrade_username', profile.username);
      }
      if (profile.email) {
        setEmail(profile.email);
        localStorage.setItem('papertrade_user_email', profile.email);
      }
      if (profile.avatar_url) {
        setAvatarUrl(profile.avatar_url);
        localStorage.setItem('papertrade_avatar_url', profile.avatar_url);
      }
      if (profile.default_country && !localStorage.getItem('papertrade_country')) {
        setActiveCountry(profile.default_country);
        localStorage.setItem('papertrade_country', profile.default_country);
      }
      if (!profile.is_onboarded) {
        setIsOnboardingOpen(true);
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoadingAuth(false);
    }
  }, [token, username, email]);

  useEffect(() => {
    fetchProfile();
    fetchMarketData(activeCountry);

    // Refresh market status clock every 30s
    const timer = setInterval(() => {
      fetchMarketData(activeCountry);
    }, 30000);
    return () => clearInterval(timer);
  }, [fetchProfile, fetchMarketData, activeCountry]);

  // Handle Login with Username/Email + Password
  const handleLogin = async (usernameOrEmail, password) => {
    setLoadingAuth(true);
    try {
      const res = await stockApi.login(usernameOrEmail, password);
      const { access_token, user } = res;

      localStorage.setItem('papertrade_access_token', access_token);
      localStorage.setItem('papertrade_username', user.username);
      if (user.email) {
        localStorage.setItem('papertrade_user_email', user.email);
      }
      if (user.avatar_url) {
        localStorage.setItem('papertrade_avatar_url', user.avatar_url);
        setAvatarUrl(user.avatar_url);
      }

      setToken(access_token);
      setUsername(user.username);
      setEmail(user.email || '');
      setUserProfile(user);
      setIsAuthModalOpen(false);

      if (user.default_country) {
        setActiveCountry(user.default_country);
        localStorage.setItem('papertrade_country', user.default_country);
      }

      return user;
    } catch (err) {
      console.error('Login error:', err);
      throw err;
    } finally {
      setLoadingAuth(false);
    }
  };

  // Handle Register with Username + Password + optional avatar
  const handleRegister = async (regUsername, regPassword, regEmail = null, regCountry = 'US', customAvatar = null) => {
    setLoadingAuth(true);
    try {
      const countryObj = COUNTRIES.find((c) => c.code === regCountry) || COUNTRIES[0];
      const res = await stockApi.register(regUsername, regPassword, regEmail, regCountry, countryObj.currency, customAvatar);
      const { access_token, user } = res;

      localStorage.setItem('papertrade_access_token', access_token);
      localStorage.setItem('papertrade_username', user.username);
      if (user.email) {
        localStorage.setItem('papertrade_user_email', user.email);
      }
      if (user.avatar_url) {
        localStorage.setItem('papertrade_avatar_url', user.avatar_url);
        setAvatarUrl(user.avatar_url);
      }

      setToken(access_token);
      setUsername(user.username);
      setEmail(user.email || '');
      setUserProfile(user);
      setActiveCountry(regCountry);
      localStorage.setItem('papertrade_country', regCountry);
      setIsAuthModalOpen(false);

      return user;
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    } finally {
      setLoadingAuth(false);
    }
  };

  // Handle 1-Click Google Sign-In
  const handleGoogleLogin = async (googleUser) => {
    setLoadingAuth(true);
    try {
      const res = await stockApi.googleLogin(
        googleUser.google_id || 'goog_' + Date.now(),
        googleUser.email,
        googleUser.name,
        googleUser.avatar_url || 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        googleUser.default_country || activeCountry
      );
      const { access_token, user } = res;

      localStorage.setItem('papertrade_access_token', access_token);
      localStorage.setItem('papertrade_username', user.username);
      if (user.email) {
        localStorage.setItem('papertrade_user_email', user.email);
      }
      if (user.avatar_url) {
        localStorage.setItem('papertrade_avatar_url', user.avatar_url);
        setAvatarUrl(user.avatar_url);
      }

      setToken(access_token);
      setUsername(user.username);
      setEmail(user.email || '');
      setUserProfile(user);
      setIsAuthModalOpen(false);

      if (user.default_country) {
        setActiveCountry(user.default_country);
        localStorage.setItem('papertrade_country', user.default_country);
      }

      return user;
    } catch (err) {
      console.error('Google sign-in error:', err);
      throw err;
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleUpdateAvatar = async (newAvatarUrl) => {
    setAvatarUrl(newAvatarUrl);
    localStorage.setItem('papertrade_avatar_url', newAvatarUrl);
    if (userProfile) {
      setUserProfile((prev) => ({ ...prev, avatar_url: newAvatarUrl }));
    }
    if (token || username || email) {
      try {
        const updated = await stockApi.updateAvatar(newAvatarUrl);
        if (updated) {
          setUserProfile(updated);
        }
      } catch (err) {
        console.error('Failed to sync custom avatar to backend:', err);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('papertrade_access_token');
    localStorage.removeItem('papertrade_username');
    localStorage.removeItem('papertrade_user_email');
    localStorage.removeItem('papertrade_avatar_url');
    setToken('');
    setUsername('');
    setEmail('');
    setAvatarUrl('');
    setUserProfile(null);
    setIsAuthModalOpen(true);
  };

  const handleCompleteOnboarding = async (countryCode) => {
    try {
      const countryObj = COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
      const updated = await stockApi.completeOnboarding(countryCode, countryObj.currency);
      setUserProfile(updated);
      setActiveCountry(countryCode);
      localStorage.setItem('papertrade_country', countryCode);
      setIsOnboardingOpen(false);
      fetchMarketData(countryCode);
    } catch (err) {
      console.error('Onboarding update failed:', err);
    }
  };

  // Switch International Market Profile
  const switchMarketProfile = async (code) => {
    setActiveCountry(code);
    localStorage.setItem('papertrade_country', code);
    const countryObj = COUNTRIES.find((c) => c.code === code) || COUNTRIES[0];
    
    fetchMarketData(code);

    if (countryObj && (token || username || email)) {
      try {
        const newPortfolio = await stockApi.switchCurrency(countryObj.currency);
        return newPortfolio;
      } catch (e) {
        console.error('Failed to sync currency conversion to backend:', e);
      }
    }
    return null;
  };

  const currentCountryObj = COUNTRIES.find((c) => c.code === activeCountry) || COUNTRIES[0];

  const getCurrencyFromTicker = (ticker) => {
    if (!ticker) return currentCountryObj.currency;
    const t = String(ticker).toUpperCase();
    if (t.endsWith('.NS') || t.endsWith('.BO') || t.startsWith('^BSE') || t.startsWith('^NSE') || t === 'INR' || t === 'IN') return 'INR';
    if (t.endsWith('.T') || t === '^N225' || t === 'JPY' || t === 'JP') return 'JPY';
    if (t.endsWith('.L') || t === '^FTSE' || t === 'GBP' || t === 'GB') return 'GBP';
    if (t.endsWith('.DE') || t.endsWith('.PA') || t.endsWith('.AS') || t === '^GDAXI' || t === 'EUR' || t === 'EU') return 'EUR';
    if (t.endsWith('.HK') || t === '^HSI' || t === 'HKD' || t === 'HK') return 'HKD';
    if (t.endsWith('.TO') || t === '^GSPTSE' || t === 'CAD' || t === 'CA') return 'CAD';
    if (t.endsWith('.AX') || t === '^AXJO' || t === 'AUD' || t === 'AU') return 'AUD';
    if (t.endsWith('.SW') || t === '^SSMI' || t === 'CHF' || t === 'CH') return 'CHF';
    return 'USD';
  };

  const getCurrencySymbol = (currencyOrTicker) => {
    if (!currencyOrTicker) return currentCountryObj.symbol || '$';
    const c = String(currencyOrTicker).toUpperCase();
    if (c === 'INR' || c.endsWith('.NS') || c.endsWith('.BO') || c === 'IN' || c === '^BSESN' || c === '^NSEI') return '₹';
    if (c === 'GBP' || c.endsWith('.L') || c === 'GB' || c === '^FTSE') return '£';
    if (c === 'JPY' || c.endsWith('.T') || c === 'JP' || c === '^N225') return '¥';
    if (c === 'EUR' || c.endsWith('.DE') || c.endsWith('.PA') || c.endsWith('.AS') || c === 'EU' || c === '^GDAXI') return '€';
    if (c === 'HKD' || c.endsWith('.HK') || c === 'HK' || c === '^HSI') return 'HK$';
    if (c === 'CAD' || c.endsWith('.TO') || c === 'CA' || c === '^GSPTSE') return 'CA$';
    if (c === 'AUD' || c.endsWith('.AX') || c === 'AU' || c === '^AXJO') return 'A$';
    if (c === 'CHF' || c.endsWith('.SW') || c === 'CH' || c === '^SSMI') return 'CHF ';
    return '$';
  };

  const convertFx = (amount, fromCurrency = 'USD', toCurrency = currentCountryObj.currency) => {
    const from = (fromCurrency || 'USD').toUpperCase();
    const to = (toCurrency || currentCountryObj.currency || 'USD').toUpperCase();
    const num = Number(amount) || 0;
    if (from === to) return num;
    const fromRate = FX_RATES[from] || 1.0;
    const toRate = FX_RATES[to] || 1.0;
    return num * (toRate / fromRate);
  };

  const formatCurrency = (amount, targetCurrencyOrTicker = null, sourceCurrency = null) => {
    const sym = getCurrencySymbol(targetCurrencyOrTicker);
    const targetCurr = targetCurrencyOrTicker
      ? (targetCurrencyOrTicker.length === 3 ? targetCurrencyOrTicker.toUpperCase() : getCurrencyFromTicker(targetCurrencyOrTicker))
      : currentCountryObj.currency;
    const num = Number(amount) || 0;
    const finalVal = sourceCurrency ? convertFx(num, sourceCurrency, targetCurr) : num;
    return `${sym}${finalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        email,
        avatarUrl,
        userProfile,
        activeCountry,
        currentCountryObj,
        marketProfiles,
        marketStatus,
        changeCountry: switchMarketProfile,
        switchMarketProfile,
        login: handleLogin,
        register: handleRegister,
        loginWithGoogle: handleGoogleLogin,
        updateAvatar: handleUpdateAvatar,
        logout: handleLogout,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isOnboardingOpen,
        setIsOnboardingOpen,
        completeOnboarding: handleCompleteOnboarding,
        loadingAuth,
        formatCurrency,
        getCurrencySymbol,
        getCurrencyFromTicker,
        convertFx,
        FX_RATES,
        countries: COUNTRIES,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
