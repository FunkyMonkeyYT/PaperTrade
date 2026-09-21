import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Video,
  Play,
  Calculator,
  Compass,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Shield,
  Layers,
  ChevronRight,
  X,
  BookmarkCheck,
  Star,
  GraduationCap,
  Award,
  Globe2,
  Laptop,
  Users,
  Building2,
  Tv,
  Briefcase,
  Target,
  Trophy,
  Code2,
  Lightbulb,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// 1. Curated YouTube Educational Videos
const VIDEOS = [
  {
    id: 'v1',
    title: 'How The Economic Machine Works by Ray Dalio',
    channel: 'Bridgewater Associates',
    duration: '31:00',
    level: 'All Levels',
    category: 'Macroeconomics',
    youtubeId: 'PHe0bXAIuk0',
    thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&auto=format&fit=crop&q=80',
    description: 'Ray Dalio’s iconic animated breakdown of credit cycles, interest rates, deleveraging, and central bank policy that drive market valuations.',
    topics: ['Short-Term Debt Cycles', 'Long-Term Debt Cycles', 'Deleveraging & Austerity', 'Monetary Policy & Inflation']
  },
  {
    id: 'v2',
    title: 'Technical Analysis Masterclass: Candlesticks & Price Action',
    channel: 'The Plain Bagel',
    duration: '22:15',
    level: 'Beginner',
    category: 'Technical Analysis',
    youtubeId: '4Zk_Lw9jYgE',
    thumbnail: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=600&auto=format&fit=crop&q=80',
    description: 'How to read candlestick patterns, dynamic support & resistance levels, volume profiles, and trend confirmations without falling for common chart traps.',
    topics: ['Support & Resistance', 'Candlestick Anatomy', 'Volume Confirmation', 'Trendlines & Channels']
  },
  {
    id: 'v3',
    title: 'How Algorithmic & Quantitative Trading Works in Practice',
    channel: 'Patrick Boyle (Quantitative Finance)',
    duration: '26:40',
    level: 'Intermediate',
    category: 'Algorithmic Trading',
    youtubeId: '2pWv7r_k8m4',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
    description: 'Hedge fund manager Patrick Boyle explains market making, high-frequency algorithms, statistical arbitrage, and quantitative alpha discovery.',
    topics: ['Statistical Arbitrage', 'Market Making & Order Books', 'Alpha Factors', 'Backtesting Execution Lag']
  },
  {
    id: 'v4',
    title: 'MIT Finance Theory: Market Efficiency & Asset Pricing Models',
    channel: 'MIT OpenCourseWare (Prof. Andrew Lo)',
    duration: '48:20',
    level: 'Advanced',
    category: 'Academic & Quant',
    youtubeId: 'HdHlfiOAJyE',
    thumbnail: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=600&auto=format&fit=crop&q=80',
    description: 'MIT Sloan Professor Andrew Lo presents the Efficient Market Hypothesis, random walk theory, CAPM beta, and behavioral finance anomalies.',
    topics: ['Efficient Market Hypothesis', 'CAPM & Beta', 'Modern Portfolio Theory', 'Behavioral Market Anomalies']
  },
  {
    id: 'v5',
    title: 'Risk Management & Position Sizing: The 1% Rule Explained',
    channel: 'The Plain Bagel',
    duration: '19:35',
    level: 'All Levels',
    category: 'Risk Management',
    youtubeId: '9D5Kj4iZ0y4',
    thumbnail: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=600&auto=format&fit=crop&q=80',
    description: 'Why capital preservation is the single most important skill in trading. Learn mathematical position sizing equations and stop loss mechanics.',
    topics: ['1% Risk Rule', 'Risk-to-Reward Ratio (1:2+)', 'Drawdown Recovery Mathematics', 'Trailing Stops']
  },
  {
    id: 'v6',
    title: 'Quantitative Valuation & Fundamental Multiples Masterclass',
    channel: 'Prof. Aswath Damodaran (NYU Stern)',
    duration: '35:10',
    level: 'Intermediate',
    category: 'Valuation & Fundamentals',
    youtubeId: '4H5lEw2B6x0',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
    description: 'The "Dean of Valuation" breaks down P/E ratios, EV/EBITDA, Discounted Cash Flow (DCF), and how to separate hype from intrinsic corporate value.',
    topics: ['P/E & PEG Multiples', 'Discounted Cash Flow (DCF)', 'Cost of Capital (WACC)', 'Margin of Safety']
  },
  {
    id: 'v7',
    title: 'How High Frequency Trading (HFT) Actually Operates',
    channel: 'Bloomberg Markets and Finance',
    duration: '18:45',
    level: 'Advanced',
    category: 'Algorithmic Trading',
    youtubeId: 'ge0b1gWbFhQ',
    thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    description: 'A deep dive into microsecond latency, co-location servers at exchange data centers, and order book mechanics used by Citadel and Jane Street.',
    topics: ['Colocation Servers', 'L2 & L3 Order Books', 'Latency Arbitrage', 'Market Microstructure']
  },
  {
    id: 'v8',
    title: 'Evidence-Based Investing & Factor Premiums (Fama-French)',
    channel: 'Ben Felix (Common Sense Investing)',
    duration: '16:50',
    level: 'Intermediate',
    category: 'Quantitative Investing',
    youtubeId: '2MVSsVi1_e4',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80',
    description: 'Empirical analysis of factor investing: Value, Size, Momentum, Quality, and why low-cost index investing beats 95% of active mutual funds.',
    topics: ['Fama-French 5-Factor Model', 'Small-Cap Value Premium', 'Momentum Factor', 'Tracking Error']
  }
];

// 2. Recommended YouTube Channels for High Schoolers & Traders
const RECOMMENDED_CHANNELS = [
  {
    name: 'Aswath Damodaran',
    handle: '@AswathDamodaranonValuation',
    url: 'https://www.youtube.com/@AswathDamodaranonValuation',
    tag: 'Valuation & Corporate Finance',
    badge: 'NYU Stern Professor',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    description: 'Known worldwide as the "Dean of Valuation". Teaches full undergraduate and MBA courses in Corporate Finance, Valuation, and Investment Philosophy for free.'
  },
  {
    name: 'Patrick Boyle',
    handle: '@PBoyle',
    url: 'https://www.youtube.com/@PBoyle',
    tag: 'Hedge Funds & Quantitative Finance',
    badge: 'Hedge Fund Manager',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
    description: 'Former investment banker and current hedge fund manager & university professor. Breaks down quantitative finance, derivatives, and financial market history with dry wit.'
  },
  {
    name: 'The Plain Bagel',
    handle: '@ThePlainBagel',
    url: 'https://www.youtube.com/@ThePlainBagel',
    tag: 'Market Mechanics & Financial Education',
    badge: 'CFA & CFP Analyst',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    description: 'Clear, grounded, non-hyped financial education by Richard Coffin (CFA, CFP). Essential viewing for high school and college students learning how real markets operate.'
  },
  {
    name: 'Ben Felix (Common Sense Investing)',
    handle: '@BenFelixCSI',
    url: 'https://www.youtube.com/@BenFelixCSI',
    tag: 'Portfolio Theory & Empirical Finance',
    badge: 'PWL Capital Portfolio Manager',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
    description: 'Deep, peer-reviewed academic finance research synthesized into practical insights. Covers Modern Portfolio Theory, factor investing, and risk-adjusted returns.'
  },
  {
    name: 'QuantPy',
    handle: '@QuantPy',
    url: 'https://www.youtube.com/@QuantPy',
    tag: 'Python for Quant Finance',
    badge: 'Algorithmic Coding',
    avatar: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=120&auto=format&fit=crop&q=80',
    description: 'Step-by-step tutorials on programming quantitative trading models, Monte Carlo simulations, options pricing models, and backtesters using Python and Pandas.'
  },
  {
    name: 'MIT OpenCourseWare',
    handle: '@mitocw',
    url: 'https://www.youtube.com/@mitocw',
    tag: 'World-Class University Lectures',
    badge: 'MIT Sloan School of Management',
    avatar: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=120&auto=format&fit=crop&q=80',
    description: 'Complete video lecture series for MIT 15.401 (Finance Theory) and 18.S096 (Topics in Mathematics with Applications to Finance).'
  }
];

// 3. High School Student Finance Career & College Guide
const CAREER_TRACKS = [
  {
    role: 'Investment Banking (IBD: M&A, Restructuring, ECM/DCM)',
    whatTheyDo: 'Advises Fortune 500 corporations on buying/selling companies (M&A), initial public offerings (IPOs), and raising debt/equity capital.',
    topColleges: [
      { name: 'Wharton (UPenn)', tier: 'Target Tier 1', notes: 'Undisputed #1 undergraduate business school on Wall Street.' },
      { name: 'Harvard University', tier: 'Target Tier 1', notes: 'Elite placement across Goldman Sachs, Morgan Stanley, Evercore.' },
      { name: 'Columbia University', tier: 'Target Tier 1', notes: 'Direct NYC location advantage, heavy Wall Street alumni network.' },
      { name: 'NYU Stern', tier: 'Target Tier 1', notes: 'Top feeder directly into Manhattan bulge bracket and elite boutiques.' },
      { name: 'Dartmouth College', tier: 'Target Tier 1', notes: 'Tightest alumni network in finance; exceptional per-capita placement.' },
      { name: 'Michigan Ross / UVA McIntire', tier: 'Top Public Target', notes: 'Massive alumni representation across all major investment banks.' },
      { name: 'UT Austin McCombs / Indiana Kelley', tier: 'Top Regional Target', notes: 'Dominates energy/tech investment banking and Wall Street workshops.' }
    ],
    recommendedMajors: ['Finance', 'Economics', 'Applied Mathematics', 'Business Administration'],
    startingComp: '$110,000 - $140,000 base + 70-100% bonus ($180k - $240k all-in Year 1)'
  },
  {
    role: 'Quantitative Trading, HFT & Quant Research',
    whatTheyDo: 'Designs mathematical algorithms, statistical models, and low-latency code to trade equities, futures, and crypto at Jane Street, Citadel Securities, Jump Trading, and Two Sigma.',
    topColleges: [
      { name: 'MIT (Massachusetts Institute of Technology)', tier: 'Target Tier 1', notes: '#1 recruitment ground for Jane Street, Citadel, and HRT.' },
      { name: 'Carnegie Mellon (CMU SCS / Math)', tier: 'Target Tier 1', notes: 'Unrivaled computational and algorithms training.' },
      { name: 'Princeton University', tier: 'Target Tier 1', notes: 'Elite ORFE (Operations Research & Financial Engineering) program.' },
      { name: 'Stanford University', tier: 'Target Tier 1', notes: 'Top CS and AI/ML pipeline for algorithmic proprietary trading.' },
      { name: 'UC Berkeley (EECS / Applied Math)', tier: 'Target Tier 1', notes: 'Massive engineering presence in algorithmic trading and HFT.' },
      { name: 'Harvard / Caltech / Columbia', tier: 'Target Tier 1', notes: 'World-renowned physics, pure mathematics, and statistical faculty.' }
    ],
    recommendedMajors: ['Computer Science', 'Pure/Applied Mathematics', 'Physics', 'Operations Research', 'Statistics'],
    startingComp: '$200,000 - $350,000 base + $150k - $300k performance bonus ($400k - $600k+ total Year 1)'
  },
  {
    role: 'Private Equity (PE) & Growth Equity',
    whatTheyDo: 'Acquires private or public companies using leveraged buyouts (LBOs), improves operational efficiency, and sells them 4-7 years later for massive returns (Blackstone, KKR, Carlyle).',
    topColleges: [
      { name: 'Wharton / Harvard / Stanford / Yale', tier: 'Target Tier 1', notes: 'Traditional path is 2 years in top Investment Banking/Consulting -> Mega-Fund PE.' },
      { name: 'Princeton / Columbia / Dartmouth', tier: 'Target Tier 1', notes: 'High representation in direct undergraduate PE analyst programs.' },
      { name: 'Duke / Northwestern / UChicago', tier: 'Target Tier 1', notes: 'Strong presence in middle-market and mega-fund recruiting.' }
    ],
    recommendedMajors: ['Economics', 'Finance', 'Accounting', 'Dual Degree Engineering + Business'],
    startingComp: '$150,000 - $180,000 base + 100% bonus + carry trajectory'
  },
  {
    role: 'Hedge Funds & Equity Research (Long/Short, Multi-Strategy)',
    whatTheyDo: 'Deep fundamental valuation, variant perception analysis, and statistical factor modeling to generate alpha for institutional investors (Millennium, Citadel, Point72).',
    topColleges: [
      { name: 'Columbia / Wharton / Harvard', tier: 'Target Tier 1', notes: 'Columbia is the birthplace of Value Investing (Benjamin Graham).' },
      { name: 'UChicago / MIT / Princeton', tier: 'Target Tier 1', notes: 'Ideal for multi-strategy and systematic macro funds.' }
    ],
    recommendedMajors: ['Economics', 'Finance', 'Data Science', 'Applied Mathematics'],
    startingComp: '$130,000 - $200,000 + performance upside'
  }
];

// 4. Standout High School Extracurricular Activities (ECs)
const HIGH_SCHOOL_ECS = [
  {
    title: 'Wharton Global High School Investment Competition (WGHSIC)',
    category: 'Prestigious Competition',
    badge: 'Top Tier Resume Builder',
    description: 'An official 10-week simulated investing competition run by Wharton School. Teams manage a $100,000 virtual portfolio and present an institutional investment strategy to a judging panel.',
    link: 'https://globalyouth.wharton.upenn.edu/competitions/investment-competition/',
    impact: 'Finalists and regional winners routinely get accepted to Wharton, Harvard, Stanford, and Columbia.'
  },
  {
    title: 'National Economics Challenge (NEC) by CEE',
    category: 'Academic Olympiad',
    badge: 'National Recognition',
    description: 'The highest-prestige economics competition in the US for high schoolers. Tests microeconomics, macroeconomics, and global economic policy in a quiz-bowl style format.',
    link: 'https://www.councilforeconed.org/national-economics-challenge/',
    impact: 'Demonstrates deep mastery of macroeconomic concepts and analytical thinking.'
  },
  {
    title: 'USACO (USA Computing Olympiad) & AMC/AIME Math',
    category: 'STEM & Quant Track',
    badge: 'Must-Have for Quant Trading',
    description: 'Scoring well in AMC 10/12, making AIME/USAMO, or reaching USACO Gold/Platinum is the #1 credential that quantitative hedge funds (Jane Street, Citadel) look for on college/internship resumes.',
    link: 'http://www.usaco.org/',
    impact: 'Guaranteed differentiator for MIT, CMU, Princeton, Stanford admissions.'
  },
  {
    title: 'Independent Quantitative Research & Backtesting',
    category: 'Independent Project',
    badge: 'High Initiative',
    description: 'Build your own quantitative backtester using Python and Pandas on historical stock data (or use PaperTrade export). Write a research paper on momentum factors, volatility clustering, or risk parity and publish on SSRN or GitHub.',
    link: 'https://ssrn.com/',
    impact: 'Shows self-driven curiosity, coding skills, and genuine passion beyond school coursework.'
  },
  {
    title: 'Founding a High School Investment Club / Paper Trading League',
    category: 'Leadership & Mentorship',
    badge: 'Demonstrated Leadership',
    description: 'Found or lead an active investment club at your high school. Run weekly market briefings, host paper trading competitions on PaperTrade, and teach younger peers personal finance.',
    impact: 'Demonstrates peer leadership, organization, and communication skills.'
  },
  {
    title: 'DECA / FBLA National Finance & Financial Consulting Events',
    category: 'Business & Presentation',
    badge: 'Case Study Mastery',
    description: 'Competing in Financial Services, Corporate Finance, or Stock Market Game events at the State (SCDC) and International (ICDC) levels.',
    link: 'https://www.deca.org/',
    impact: 'Builds quick on-your-feet presentation skills and institutional business vocabulary.'
  }
];

export default function LearningPage({ onSelectTicker }) {
  const [activeTab, setActiveTab] = useState('videos'); // 'videos' | 'channels' | 'colleges' | 'ecs'
  const [selectedVideo, setSelectedVideo] = useState(VIDEOS[0]);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="space-y-6 animate-fadeIn transition-colors">
      
      {/* Hero Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563EB]/10 border border-[#2563EB]/25 text-xs font-mono font-bold text-[#2563EB]">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>PaperTrade Learning Area</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Quantitative Academy & High School Finance Guide
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-mono leading-relaxed">
              Educational resources from university professors and industry professionals, including video masterclasses and career guides for quantitative finance.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 font-mono text-center shrink-0">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Videos</div>
              <div className="text-base font-bold text-slate-900">{VIDEOS.length} Modules</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Channels</div>
              <div className="text-base font-bold text-[#2563EB]">{RECOMMENDED_CHANNELS.length} Curated</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="text-[10px] text-slate-500 uppercase font-bold">Target Paths</div>
              <div className="text-base font-bold text-profit">4 Careers</div>
            </div>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-200 overflow-x-auto no-scrollbar">
          {[
            { id: 'videos', label: 'Video Masterclasses', icon: Video },
            { id: 'channels', label: 'Recommended Channels', icon: Tv },
            { id: 'colleges', label: 'College & Career Target Schools', icon: Building2 },
            { id: 'ecs', label: 'High School ECs & Competitions', icon: Trophy },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === t.id
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: Video Masterclasses */}
      {activeTab === 'videos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Video Player & Notes (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="relative w-full aspect-video bg-black flex items-center justify-center">
                {isPlaying ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1&rel=0`}
                    title={selectedVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="relative w-full h-full group cursor-pointer" onClick={() => setIsPlaying(true)}>
                    <img
                      src={selectedVideo.thumbnail}
                      alt={selectedVideo.title}
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black/60 flex flex-col justify-between p-6">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#2563EB] text-white shadow-sm">
                          {selectedVideo.category}
                        </span>
                        <span className="text-xs font-mono text-slate-300 bg-black/80 px-2 py-0.5 rounded">
                          {selectedVideo.duration}
                        </span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                            {selectedVideo.title}
                          </h3>
                          <p className="text-xs text-slate-300 font-mono mt-0.5">
                            {selectedVideo.channel}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Metadata & Description */}
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedVideo.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 text-xs font-mono text-slate-600">
                      <span className="font-semibold text-[#2563EB]">{selectedVideo.channel}</span>
                      <span>•</span>
                      <span>{selectedVideo.level}</span>
                      <span>•</span>
                      <span>{selectedVideo.duration}</span>
                    </div>
                  </div>

                  <a
                    href={`https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-xs font-mono font-bold text-slate-700 border border-slate-200 transition-colors"
                  >
                    <span>Watch on YouTube</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 font-mono leading-relaxed">
                  {selectedVideo.description}
                </p>

                {/* Key Concepts Covered */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase font-mono mb-2">
                    Key Concepts Covered:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedVideo.topics.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono text-slate-800"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Playlist Sidebar (1 Col) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase font-mono px-1">
              Curated Curriculum ({VIDEOS.length} Masterclasses)
            </h3>
            
            <div className="space-y-2.5">
              {VIDEOS.map((vid) => {
                const isSelected = vid.id === selectedVideo.id;
                return (
                  <div
                    key={vid.id}
                    onClick={() => {
                      setSelectedVideo(vid);
                      setIsPlaying(true);
                    }}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex gap-3 ${
                      isSelected
                        ? 'bg-slate-50 border-[#2563EB] shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-20 h-14 rounded overflow-hidden relative shrink-0 bg-black">
                      <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                      <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[9px] font-mono px-1 rounded text-white">
                        {vid.duration}
                      </span>
                    </div>

                    <div className="flex flex-col justify-between overflow-hidden">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                        {vid.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 mt-1">
                        <span className="truncate">{vid.channel}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: Recommended YouTube Channels */}
      {activeTab === 'channels' && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 font-mono">
              Top Recommended Channels for High Schoolers & Aspiring Quants
            </h3>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              These channels offer rigorous, non-sensationalized market education from university professors, CFA charterholders, and hedge fund managers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {RECOMMENDED_CHANNELS.map((ch, idx) => (
              <div
                key={idx}
                className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col justify-between hover:border-[#2563EB] transition-all"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={ch.avatar}
                      alt={ch.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#2563EB] shadow-sm"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 font-sans">
                        {ch.name}
                      </h4>
                      <div className="text-[11px] font-mono text-[#2563EB] font-semibold">{ch.handle}</div>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {ch.badge}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 font-mono leading-relaxed mb-4">
                    {ch.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500 font-semibold">
                    {ch.tag}
                  </span>
                  <a
                    href={ch.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#2563EB] hover:underline"
                  >
                    <span>Visit Channel</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: College & Career Guide for Different Finance Positions */}
      {activeTab === 'colleges' && (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 font-mono">
              Which Colleges Are Best For Different Finance Careers?
            </h3>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              Wall Street and Quantitative Trading firms hire heavily based on target school pipelines. Here is the realistic breakdown by career track.
            </p>
          </div>

          <div className="space-y-5">
            {CAREER_TRACKS.map((track, idx) => (
              <div
                key={idx}
                className="p-5 sm:p-6 rounded-lg border border-slate-200 bg-white shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#2563EB]" />
                      <span>{track.role}</span>
                    </h4>
                    <p className="text-xs text-slate-600 font-mono mt-1">
                      {track.whatTheyDo}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">First Year Compensation</span>
                    <span className="text-xs font-mono font-bold text-profit bg-profit-badge px-2 py-0.5 rounded">
                      {track.startingComp}
                    </span>
                  </div>
                </div>

                {/* Target Schools Table */}
                <div>
                  <h5 className="text-xs font-bold text-slate-500 uppercase font-mono mb-2.5">
                    Target Universities & Hiring Power:
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {track.topColleges.map((col, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-3 rounded-md bg-slate-50 border border-slate-200 font-mono"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-900">{col.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB] font-semibold">
                            {col.tier}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-tight">
                          {col.notes}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Majors */}
                <div className="flex items-center gap-2 flex-wrap pt-2 text-xs font-mono">
                  <span className="text-slate-500 font-bold uppercase text-[11px]">Recommended College Majors:</span>
                  {track.recommendedMajors.map((m, mIdx) => (
                    <span
                      key={mIdx}
                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[11px]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: High School Extracurriculars (ECs) & Competitions */}
      {activeTab === 'ecs' && (
        <div className="space-y-6">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 font-mono">
              High School Extracurriculars (ECs) That Top College Admissions Love
            </h3>
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              To stand out for Wharton, Harvard, MIT, or Stanford finance/quant tracks, you need Tier 1 & Tier 2 extracurriculars that demonstrate passion and quantitative rigor.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HIGH_SCHOOL_ECS.map((ec, idx) => (
              <div
                key={idx}
                className="p-5 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col justify-between hover:border-[#2563EB] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/25">
                      {ec.category}
                    </span>
                    <span className="text-[10px] font-mono text-profit bg-profit-badge px-2 py-0.5 rounded font-bold">
                      {ec.badge}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-slate-900 font-sans mb-2">
                    {ec.title}
                  </h4>

                  <p className="text-xs text-slate-700 font-mono leading-relaxed mb-3">
                    {ec.description}
                  </p>

                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-600 mb-3">
                    <span className="font-bold text-slate-900">Why it works: </span>
                    {ec.impact}
                  </div>
                </div>

                {ec.link && (
                  <div className="pt-2 border-t border-slate-200 flex justify-end">
                    <a
                      href={ec.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#2563EB] hover:underline"
                    >
                      <span>Official Website / Resource</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* High School Year-by-Year Action Plan */}
          <div className="p-5 sm:p-6 rounded-lg border border-slate-200 bg-white shadow-sm">
            <h4 className="text-base font-bold text-slate-900 font-mono mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#2563EB]" />
              <span>High School 9th - 12th Grade Year-by-Year Finance Roadmap</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-[#2563EB] uppercase text-[11px] block">9th Grade (Freshman)</span>
                <p className="text-slate-700 leading-snug">
                  Build strong math foundation (Geometry/Algebra 2). Learn Python fundamentals and start paper trading on PaperTrade to understand how stocks move.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-[#16A34A] uppercase text-[11px] block">10th Grade (Sophomore)</span>
                <p className="text-slate-700 leading-snug">
                  Join or start your school's Investment Club. Compete in the Wharton High School Investment Competition. Take AMC 10 and USACO.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-[#D97706] uppercase text-[11px] block">11th Grade (Junior)</span>
                <p className="text-slate-700 leading-snug">
                  Execute an independent financial research project or algorithmic backtest. Compete in National Economics Challenge (NEC) and DECA/FBLA State.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="font-bold text-[#2563EB] uppercase text-[11px] block">12th Grade (Senior)</span>
                <p className="text-slate-700 leading-snug">
                  Craft college application essays highlighting your hands-on financial leadership, research, and passion. Apply to top target universities!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
