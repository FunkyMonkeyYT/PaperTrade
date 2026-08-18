import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import MarketHealthBar from './components/MarketHealthBar';
import HomePage from './components/HomePage';
import MarketProfileHeader from './components/MarketProfileHeader';
import StockHeader from './components/StockHeader';
import ChartContainer from './components/ChartContainer';
import TechnicalIndicatorsPanel from './components/TechnicalIndicatorsPanel';
import TradingPanel from './components/TradingPanel';
import PortfolioSummary from './components/PortfolioSummary';
import TransactionHistory from './components/TransactionHistory';
import LearningPage from './components/LearningPage';
import AuthModal from './components/AuthModal';
import OnboardingModal from './components/OnboardingModal';
import ExportDataModal from './components/ExportDataModal';
import ComplianceDisclaimer from './components/ComplianceDisclaimer';
import SearchModal from './components/SearchModal';
import { stockApi } from './services/api';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import { Home, LayoutDashboard, Wallet, GraduationCap, AlertTriangle } from 'lucide-react';

export default function App() {
  const {
    username,
    email,
    activeCountry,
    currentCountryObj,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isOnboardingOpen,
    setIsOnboardingOpen,
    formatCurrency,
  } = useAuth();
  const { isDark } = useTheme();

  const [selectedTicker, setSelectedTicker] = useState(() => {
    return currentCountryObj?.defaultTicker || 'AAPL';
  });
  const [timeframe, setTimeframe] = useState('1y');
  const [metricsData, setMetricsData] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [metricsError, setMetricsError] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'trading' | 'learning' | 'portfolio'
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Fetch Stock Metrics
  const fetchMetrics = useCallback(async (ticker, tf, refresh = false) => {
    setLoadingMetrics(true);
    setMetricsError(null);
    try {
      const data = await stockApi.getMetrics(ticker, tf, refresh);
      setMetricsData(data);
    } catch (err) {
      console.error('Metrics fetch error:', err);
      const msg = err.response?.data?.detail || err.message || 'Failed to load stock analytics';
      setMetricsError(msg);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  // Fetch Portfolio & Transactions for authenticated user
  const fetchPortfolioData = useCallback(async () => {
    try {
      const [portRes, txRes] = await Promise.all([
        stockApi.getPortfolio(),
        stockApi.getTransactions(50),
      ]);
      setPortfolio(portRes);
      setTransactions(txRes);
    } catch (err) {
      console.error('Portfolio fetch error:', err);
    }
  }, [username, email, activeCountry]);

  // Initial load & ticker/timeframe listener
  useEffect(() => {
    fetchMetrics(selectedTicker, timeframe);
  }, [selectedTicker, timeframe, activeCountry, fetchMetrics]);

  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  const handleSelectTicker = (ticker) => {
    setSelectedTicker(ticker.toUpperCase());
    setActiveTab('trading');
  };

  const handleOrderSuccess = (orderRes) => {
    fetchPortfolioData();
    fetchMetrics(selectedTicker, timeframe, true);
  };

  const handleResetPortfolio = async () => {
    if (window.confirm('Reset virtual portfolio balance ($100,000 base equivalent) and clear all positions across all markets?')) {
      try {
        await stockApi.resetPortfolio();
        fetchPortfolioData();
      } catch (err) {
        alert('Failed to reset portfolio: ' + (err.response?.data?.detail || err.message));
      }
    }
  };

  const handleQuickSell = (ticker, shares) => {
    setSelectedTicker(ticker);
    setActiveTab('trading');
  };

  const handleCountryChange = (newPort) => {
    if (newPort) {
      setPortfolio(newPort);
    }
    fetchPortfolioData();
    fetchMetrics(selectedTicker, timeframe, true);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F9FAFB] flex flex-col selection:bg-[#2962FF] selection:text-white transition-colors duration-150">
      
      {/* Top Navbar */}
      <Navbar
        selectedTicker={selectedTicker}
        onSelectTicker={handleSelectTicker}
        portfolio={portfolio}
        onRefreshData={() => {
          fetchMetrics(selectedTicker, timeframe, true);
          fetchPortfolioData();
        }}
        onResetPortfolio={handleResetPortfolio}
        onOpenExport={() => setIsExportOpen(true)}
        onCountryChange={handleCountryChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        loading={loadingMetrics}
      />

      {/* Global Market Health Bar */}
      <MarketHealthBar onSelectTicker={handleSelectTicker} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-4 lg:px-8 py-3.5 sm:py-5 flex-1 flex flex-col gap-4">
        
        {/* Error Banner */}
        {metricsError && activeTab === 'trading' && (
          <div className="bg-[#EB5B5B]/15 border border-[#EB5B5B]/30 text-[#EB5B5B] px-3.5 py-2.5 rounded-lg flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{metricsError}</span>
            </div>
            <button
              onClick={() => fetchMetrics(selectedTicker, timeframe, true)}
              className="underline hover:text-white font-bold ml-2 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* View 0: Interactive Home Page */}
        {activeTab === 'home' && (
          <HomePage
            onNavigateToTrading={(ticker) => {
              if (ticker) setSelectedTicker(ticker);
              setActiveTab('trading');
            }}
            onNavigateToLearning={() => setActiveTab('learning')}
            onNavigateToPortfolio={() => setActiveTab('portfolio')}
          />
        )}

        {/* View 1: Live Terminal & Charts */}
        {activeTab === 'trading' && (
          <div className="space-y-4">
            
            {/* International Market Profile Banner */}
            <MarketProfileHeader
              selectedTicker={selectedTicker}
              onSelectTicker={handleSelectTicker}
              portfolio={portfolio}
            />

            {/* Stock Summary Header */}
            <StockHeader
              metricsData={metricsData}
              loading={loadingMetrics}
              onSelectTicker={handleSelectTicker}
            />

            {/* Middle Grid: Interactive Chart (Left) & Order Console (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              
              {/* Chart Component (2 cols wide on desktop) */}
              <div className="lg:col-span-2">
                <ChartContainer
                  candles={metricsData?.candles || []}
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  ticker={selectedTicker}
                  loading={loadingMetrics}
                />
              </div>

              {/* Trading Execution Panel (1 col wide) */}
              <div className="lg:col-span-1">
                <TradingPanel
                  ticker={selectedTicker}
                  currentPrice={metricsData?.metrics?.current_price || 0}
                  portfolio={portfolio}
                  onOrderSuccess={handleOrderSuccess}
                />
              </div>

            </div>

            {/* Technical Indicators Breakdown Panel */}
            <TechnicalIndicatorsPanel metricsData={metricsData} />

            {/* Quick Open Holdings Strip */}
            <PortfolioSummary
              portfolio={portfolio}
              onSelectTicker={handleSelectTicker}
              onQuickSell={handleQuickSell}
              onOpenSearch={() => setIsSearchOpen(true)}
            />

          </div>
        )}

        {/* View 2: Comprehensive Learning Hub */}
        {activeTab === 'learning' && (
          <LearningPage onSelectTicker={handleSelectTicker} />
        )}

        {/* View 3: Full Portfolio & History */}
        {activeTab === 'portfolio' && (
          <div className="space-y-4">
            <PortfolioSummary
              portfolio={portfolio}
              onSelectTicker={handleSelectTicker}
              onQuickSell={handleQuickSell}
              onOpenSearch={() => setIsSearchOpen(true)}
            />
            <TransactionHistory transactions={transactions} />
          </div>
        )}

      </main>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTicker={handleSelectTicker}
      />

      {/* Secure Username & Password Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* First-Time Onboarding Market Selection Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onSelectMarket={(defaultTick) => {
          setSelectedTicker(defaultTick);
          setActiveTab('trading');
        }}
      />

      {/* Machine Learning Data Export Modal */}
      <ExportDataModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        defaultTicker={selectedTicker}
      />

      {/* Compliance Disclaimer Footer */}
      <ComplianceDisclaimer />

    </div>
  );
}
