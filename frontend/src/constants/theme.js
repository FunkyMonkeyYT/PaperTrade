/**
 * Institutional FinTech Design System & Constants
 * 
 * Exact Color Scheme Specifications:
 * 1. Dark Mode: Pure Black background (#000000), Green for profit (#00D09C), Red for losses (#EB5B5B), Grey/White for text (#FFFFFF, #9CA3AF)
 * 2. Light Mode: Pure White background (#FFFFFF), Green for text (#047857), Blue for profit (#2563EB), Red for losses (#DC2626)
 */

export const THEME = {
  dark: {
    bgPage: '#000000',           // Pure Black
    cardSurface: '#0C0D0E',      // Charcoal / Pure Black Card
    subpanelSurface: '#141517',  // Elevated Panel
    borderColor: 'rgba(38, 38, 38, 0.9)',
    textPrimary: '#FFFFFF',      // White
    textSecondary: '#9CA3AF',    // Grey
    textMuted: '#6B7280',
    profit: '#00D09C',           // Green for profit
    profitBg: 'rgba(0, 208, 156, 0.15)',
    loss: '#EB5B5B',             // Red for losses
    lossBg: 'rgba(235, 91, 91, 0.15)',
    accentBlue: '#2962FF',
  },
  light: {
    bgPage: '#FFFFFF',           // Pure White
    cardSurface: '#FAFAFA',      // Crisp White Card
    subpanelSurface: '#F3F4F6',
    borderColor: '#E5E7EB',
    textPrimary: '#047857',      // Green for text
    textSecondary: '#065F46',    // Darker Green text
    textMuted: '#059669',
    profit: '#2563EB',           // Blue for profit
    profitBg: 'rgba(37, 99, 235, 0.12)',
    loss: '#DC2626',             // Red for losses
    lossBg: 'rgba(220, 38, 38, 0.12)',
    accentBlue: '#2563EB',
  },
  radii: {
    container: 'rounded-lg',     // 8px
    control: 'rounded-md',       // 6px
    pill: 'rounded-full',
  },
  typography: {
    numbers: 'font-mono tabular-nums tracking-tight',
    ui: 'font-sans antialiased',
  }
};

/**
 * Top 10 Major Financial Markets in the World
 */
export const COUNTRIES = [
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    exchange: 'NYSE / NASDAQ',
    currency: 'USD',
    symbol: '$',
    defaultTicker: 'AAPL',
    healthTicker: '^IXIC',
    popularTickers: ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'AMZN', 'GOOGL', 'META', 'PLTR', 'AMD', 'SPY']
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    exchange: 'NSE / BSE',
    currency: 'INR',
    symbol: '₹',
    defaultTicker: 'RELIANCE.NS',
    healthTicker: '^BSESN',
    popularTickers: ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'TATAMOTORS.NS', 'ICICIBANK.NS', 'SBIN.NS', 'ZOMATO.NS']
  },
  {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    exchange: 'TSE / Nikkei',
    currency: 'JPY',
    symbol: '¥',
    defaultTicker: '7203.T',
    healthTicker: '^N225',
    popularTickers: ['7203.T', '6758.T', '9984.T', '7974.T', '8058.T', '6861.T', '8035.T', '9983.T']
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    exchange: 'LSE (London Stock Exchange)',
    currency: 'GBP',
    symbol: '£',
    defaultTicker: 'SHEL.L',
    healthTicker: '^FTSE',
    popularTickers: ['SHEL.L', 'AZN.L', 'HSBC.L', 'ULVR.L', 'BP.L', 'GSK.L', 'RR.L', 'RIO.L']
  },
  {
    code: 'EU',
    name: 'Europe',
    flag: '🇪🇺',
    exchange: 'Euronext / DAX (Frankfurt & Paris)',
    currency: 'EUR',
    symbol: '€',
    defaultTicker: 'SAP.DE',
    healthTicker: '^GDAXI',
    popularTickers: ['SAP.DE', 'SIE.DE', 'ASML.AS', 'MC.PA', 'TTE.PA', 'AIR.PA', 'ALV.DE']
  },
  {
    code: 'HK',
    name: 'Hong Kong / China',
    flag: '🇨🇳',
    exchange: 'HKEX (Hong Kong Stock Exchange)',
    currency: 'HKD',
    symbol: 'HK$',
    defaultTicker: '0700.HK',
    healthTicker: '^HSI',
    popularTickers: ['0700.HK', '9988.HK', '3690.HK', '1810.HK', '1211.HK', '0941.HK']
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    exchange: 'TSX (Toronto Stock Exchange)',
    currency: 'CAD',
    symbol: 'CA$',
    defaultTicker: 'RY.TO',
    healthTicker: '^GSPTSE',
    popularTickers: ['RY.TO', 'TD.TO', 'SHOP.TO', 'ENB.TO', 'CNR.TO', 'BNS.TO']
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    exchange: 'ASX (Australian Securities Exchange)',
    currency: 'AUD',
    symbol: 'A$',
    defaultTicker: 'BHP.AX',
    healthTicker: '^AXJO',
    popularTickers: ['BHP.AX', 'CBA.AX', 'CSL.AX', 'NAB.AX', 'WES.AX', 'ANZ.AX']
  },
  {
    code: 'CH',
    name: 'Switzerland',
    flag: '🇨🇭',
    exchange: 'SIX Swiss Exchange',
    currency: 'CHF',
    symbol: 'CHF ',
    defaultTicker: 'NESN.SW',
    healthTicker: '^SSMI',
    popularTickers: ['NESN.SW', 'NOVN.SW', 'ROG.SW', 'UBSG.SW', 'ZURN.SW', 'ABBN.SW']
  },
  {
    code: 'GLOBAL',
    name: 'Global Crypto',
    flag: '🌐',
    exchange: '24/7 Digital Asset Markets',
    currency: 'USD',
    symbol: '$',
    defaultTicker: 'BTC-USD',
    healthTicker: 'BTC-USD',
    popularTickers: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'DOGE-USD', 'AVAX-USD']
  }
];

/**
 * Foreign exchange conversion baseline ($100,000 USD base capital)
 */
export const FX_RATES = {
  USD: 1.0,
  INR: 83.5,     // $100,000 USD = ₹8,350,000 INR
  JPY: 155.0,    // $100,000 USD = ¥15,500,000 JPY
  GBP: 0.79,     // $100,000 USD = £79,000 GBP
  EUR: 0.92,     // $100,000 USD = €92,000 EUR
  HKD: 7.82,     // $100,000 USD = HK$782,000 HKD
  CAD: 1.36,     // $100,000 USD = CA$136,000 CAD
  AUD: 1.52,     // $100,000 USD = A$152,000 AUD
  CHF: 0.90,     // $100,000 USD = CHF 90,000 CHF
};

export const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
];
