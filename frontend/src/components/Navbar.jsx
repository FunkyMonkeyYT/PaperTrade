import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Search,
  RotateCcw,
  Download,
  Moon,
  Sun,
  User,
  LogOut,
  ChevronDown,
  TrendingUp,
  Globe2,
  RefreshCw,
  Wallet,
  Building2,
  Check,
  Lock,
  Sparkles,
  Command,
  HelpCircle,
  ExternalLink,
  Camera,
  Settings
} from 'lucide-react';
import { useAuth, COUNTRIES } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import SearchModal from './SearchModal';
import ProfileSettingsModal from './ProfileSettingsModal';
import InstallPrompt from './InstallPrompt';

export default function Navbar({
  selectedTicker,
  onSelectTicker,
  portfolio,
  onRefreshData,
  onResetPortfolio,
  onOpenExport,
  onCountryChange,
  activeTab,
  onTabChange,
  loading,
}) {
  const {
    username,
    email,
    avatarUrl,
    activeCountry,
    currentCountryObj,
    changeCountry,
    formatCurrency,
    convertFx,
    logout,
    setIsAuthModalOpen,
  } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCountryMenuOpen, setIsCountryMenuOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);

  const userMenuRef = useRef(null);
  const countryMenuRef = useRef(null);

  // Global Hotkeys: Ctrl + K (Search)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (countryMenuRef.current && !countryMenuRef.current.contains(e.target)) {
        setIsCountryMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountryChange = async (cCode) => {
    const newPort = await changeCountry(cCode);
    setIsCountryMenuOpen(false);
    if (onCountryChange && newPort) {
      onCountryChange(newPort);
    }
    const countryObj = COUNTRIES.find((c) => c.code === cCode);
    if (countryObj) {
      onSelectTicker(countryObj.defaultTicker);
    }
  };

  const portfolioCurrency = portfolio?.currency || 'USD';
  const cash = convertFx(portfolio?.cash_balance ?? 100000, portfolioCurrency, currentCountryObj.currency);
  const totalValue = convertFx(portfolio?.total_portfolio_value ?? 100000, portfolioCurrency, currentCountryObj.currency);
  const totalReturn = portfolio?.total_return_percent ?? 0;

  // Render User Avatar or Initials Badge
  const renderUserAvatar = () => {
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt={username || 'Trader'}
          className="w-7 h-7 rounded-full object-cover border border-slate-700 shadow-sm"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      );
    }
    const initial = (username || 'T').charAt(0).toUpperCase();
    return (
      <div className="w-7 h-7 rounded-full bg-[#2962FF] text-white flex items-center justify-center text-xs font-mono font-bold shadow-sm">
        {initial}
      </div>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-3 sm:px-6 lg:px-8 py-2.5 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
          
          {/* Main Top Navigation Row */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
            
            {/* Left: Brand Logo & Navigation Tabs */}
            <div className="flex items-center gap-3 sm:gap-6 shrink-0">
              
              {/* Brand Logo */}
              <button
                onClick={() => onTabChange('home')}
                className="flex items-center gap-2 group cursor-pointer focus:outline-none shrink-0"
                title="Go to Home Overview"
              >
                <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                  <LineChart className="w-4 h-4 text-white stroke-[2.5]" />
                </div>
                <div className="hidden xs:flex flex-col text-left">
                  <span className="font-bold text-base tracking-tight text-slate-900">
                    PaperTrade<span className="text-[#2563EB] font-mono text-sm ml-0.5">.io</span>
                  </span>
                </div>
              </button>

              {/* Top 10 Major Markets Switcher Dropdown */}
              <div className="relative" ref={countryMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsCountryMenuOpen(!isCountryMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-mono font-semibold text-slate-800 transition-all cursor-pointer shadow-sm"
                  title="Switch International Market Profile"
                >
                  <span className="text-base">{currentCountryObj.flag}</span>
                  <span className="hidden sm:inline font-bold">{currentCountryObj.name}</span>
                  <span className="text-slate-500 font-normal">({currentCountryObj.currency})</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isCountryMenuOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-lg shadow-xl p-1.5 z-50 animate-scaleIn max-h-96 overflow-y-auto">
                    <div className="px-2.5 py-1.5 text-[11px] font-mono text-slate-500 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-bold uppercase tracking-wider text-slate-700">Top 10 Major Markets</span>
                      <span className="text-profit">Unified Wallet</span>
                    </div>

                    <div className="divide-y divide-slate-100 mt-1">
                      {COUNTRIES.map((c) => {
                        const isSelected = c.code === activeCountry;
                        return (
                          <button
                            key={c.code}
                            onClick={() => handleCountryChange(c.code)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-mono transition-all text-left cursor-pointer ${
                              isSelected
                                ? 'bg-[#2563EB]/10 text-[#2563EB] font-bold'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">{c.flag}</span>
                              <div>
                                <div className="font-semibold text-slate-900">{c.name}</div>
                                <div className="text-[10px] text-slate-400">{c.exchange}</div>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-slate-400">{c.currency}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Middle: Command Palette Search Bar (Ctrl + K) */}
            <div className="flex-1 max-w-md mx-2">
              <button
                type="button"
                onClick={() => setIsSearchModalOpen(true)}
                className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-3 py-1.5 text-xs sm:text-sm font-mono text-slate-600 transition-all cursor-pointer shadow-sm group"
              >
                <div className="flex items-center gap-2 truncate">
                  <Search className="w-4 h-4 text-slate-400 group-hover:text-[#2563EB] transition-colors" />
                  <span className="truncate">Search stocks, indices, crypto...</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
                  <Command className="w-3 h-3" />
                  <span>K</span>
                </div>
              </button>
            </div>

            {/* Right: Portfolio Equity, Theme Toggle, & User Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              
              {/* Portfolio Balance Chip */}
              <div
                onClick={() => onTabChange('portfolio')}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 cursor-pointer hover:border-slate-300 transition-all shadow-sm"
                title="View Portfolio & Ledger"
              >
                <div className="flex flex-col text-right">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Total Equity</span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-slate-900 tabular-nums">
                    {formatCurrency(totalValue)}
                  </span>
                </div>
                <span className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${totalReturn >= 0 ? 'bg-profit-badge' : 'bg-loss-badge'}`}>
                  {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}%
                </span>
              </div>

              {/* Install PWA App Button */}
              <InstallPrompt variant="navbar" />

              {/* Theme Switcher Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-1.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 transition-all cursor-pointer"
                title="Toggle Theme"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={onRefreshData}
                disabled={loading}
                className="p-1.5 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
                title="Refresh Live Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#2563EB]' : ''}`} />
              </button>

              {/* User Profile / Auth Button */}
              <div className="relative" ref={userMenuRef}>
                {username ? (
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-md bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer shadow-sm"
                  >
                    {renderUserAvatar()}
                    <span className="hidden sm:inline text-xs font-mono font-bold text-slate-900 max-w-[100px] truncate">
                      {username}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2563EB] hover:bg-blue-700 text-white font-mono text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                )}

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-50 animate-scaleIn">
                    
                    {/* User Header */}
                    <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200 mb-2">
                      <div className="flex items-center gap-2.5">
                        {renderUserAvatar()}
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-900 font-mono truncate">{username || 'Trader'}</div>
                          <div className="text-[11px] text-slate-500 font-mono truncate">{email || 'Verified Account'}</div>
                        </div>
                      </div>
                    </div>

                    {/* Custom PFP Settings Option */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        setIsProfileSettingsOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono text-slate-800 hover:bg-[#2563EB]/10 hover:text-[#2563EB] transition-colors text-left cursor-pointer font-bold"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Set Custom PFP (Upload/Link)</span>
                    </button>

                    {/* Export ML Dataset */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenExport();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono text-slate-700 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>Export ML Dataset</span>
                    </button>

                    {/* Reset Portfolio */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onResetPortfolio();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono text-slate-700 hover:bg-slate-100 transition-colors text-left cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reset Portfolio Capital</span>
                    </button>

                    {/* Logout */}
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-mono text-red-500 hover:bg-red-50 transition-colors text-left border-t border-slate-100 mt-1 pt-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Sub Row: Navigation Views (Home, Live Terminal, Learning Hub, Portfolio) */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {[
                { id: 'home', label: 'Home Overview' },
                { id: 'trading', label: 'Live Terminal' },
                { id: 'portfolio', label: 'Holdings & Ledger' },
                { id: 'learning', label: 'Learning Area' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active Ticker Indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-600">
              <span>Active Stock:</span>
              <span className="font-bold text-profit bg-profit-badge px-2 py-0.5 rounded">
                {selectedTicker}
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Command Palette Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectTicker={onSelectTicker}
      />

      {/* Custom PFP Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
      />
    </>
  );
}
