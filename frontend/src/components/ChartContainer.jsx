import React, { useState, useRef, useEffect } from 'react';
import { BarChart3, LineChart, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const TIMEFRAMES = [
  { label: '1D', value: '1d' },
  { label: '5D', value: '5d' },
  { label: '1M', value: '1m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
];

export default function ChartContainer({
  candles = [],
  timeframe = '1y',
  onTimeframeChange,
  ticker,
  loading
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { getCurrencySymbol } = useAuth();
  const { isDark } = useTheme();
  const currencySymbol = getCurrencySymbol(ticker);

  const [chartType, setChartType] = useState('candlestick'); // 'candlestick' or 'area'
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showBollinger, setShowBollinger] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle dynamic responsive resizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Render chart on canvas with exact theme colors
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !candles || candles.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Layout dimensions
    const isMobile = width < 540;
    const padding = { top: 12, right: isMobile ? 55 : 75, bottom: isMobile ? 28 : 36, left: isMobile ? 6 : 10 };
    const chartHeight = height - padding.top - padding.bottom;
    const volumeHeight = isMobile ? 24 : 35;
    const priceHeight = chartHeight - volumeHeight - (isMobile ? 6 : 12);
    const chartWidth = width - padding.left - padding.right;

    ctx.clearRect(0, 0, width, height);

    // Calculate Price Range
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    candles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (showBollinger && c.bb_lower && c.bb_lower < minPrice) minPrice = c.bb_lower;
      if (showBollinger && c.bb_upper && c.bb_upper > maxPrice) maxPrice = c.bb_upper;
      if (c.volume > maxVolume) maxVolume = c.volume;
    });

    const priceBuffer = (maxPrice - minPrice) * 0.05 || 1;
    minPrice -= priceBuffer;
    maxPrice += priceBuffer;
    const priceRange = maxPrice - minPrice || 1;

    const getY = (val) => padding.top + priceHeight - ((val - minPrice) / priceRange) * priceHeight;
    const getX = (idx) => padding.left + (idx / Math.max(candles.length - 1, 1)) * chartWidth;
    const candleWidth = Math.max((chartWidth / candles.length) * 0.65, 2.5);

    // Exact Theme Palette
    const COLOR_UP = isDark ? '#00D09C' : '#2563EB'; // Green (Dark) or Blue (Light)
    const COLOR_DOWN = isDark ? '#EB5B5B' : '#DC2626'; // Red
    const COLOR_SMA20 = '#F59E0B'; // Amber
    const COLOR_SMA50 = '#8B5CF6'; // Violet
    const COLOR_BOLLINGER = '#2962FF'; // Royal Blue
    const GRID_COLOR = isDark ? 'rgba(38, 38, 38, 0.7)' : 'rgba(229, 231, 235, 0.8)';
    const TEXT_COLOR = isDark ? '#9CA3AF' : '#047857';

    // 1. Draw Grid Lines & Price Ticks
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;

    const numYGrid = 5;
    for (let i = 0; i <= numYGrid; i++) {
      const priceVal = minPrice + (priceRange / numYGrid) * i;
      const y = getY(priceVal);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Price labels
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${currencySymbol}${priceVal.toFixed(2)}`, width - padding.right + 6, y + 3);
    }

    // 2. Draw Bollinger Bands Area
    if (showBollinger) {
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < candles.length; i++) {
        if (candles[i].bb_upper) {
          const x = getX(i);
          const y = getY(candles[i].bb_upper);
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      for (let i = candles.length - 1; i >= 0; i--) {
        if (candles[i].bb_lower) {
          const x = getX(i);
          const y = getY(candles[i].bb_lower);
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fillStyle = isDark ? 'rgba(41, 98, 255, 0.06)' : 'rgba(37, 99, 235, 0.08)';
      ctx.fill();

      // Upper band line
      ctx.strokeStyle = 'rgba(41, 98, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      candles.forEach((c, idx) => {
        if (c.bb_upper) {
          const x = getX(idx);
          const y = getY(c.bb_upper);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Lower band line
      ctx.beginPath();
      candles.forEach((c, idx) => {
        if (c.bb_lower) {
          const x = getX(idx);
          const y = getY(c.bb_lower);
          if (idx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. Draw Volume Histogram (Bottom)
    const volBaseY = height - padding.bottom;
    candles.forEach((c, idx) => {
      const x = getX(idx);
      const isGreen = c.close >= c.open;
      const vHeight = (c.volume / (maxVolume || 1)) * volumeHeight;
      ctx.fillStyle = isGreen
        ? (isDark ? 'rgba(0, 208, 156, 0.25)' : 'rgba(37, 99, 235, 0.25)')
        : 'rgba(235, 91, 91, 0.25)';
      ctx.fillRect(x - candleWidth / 2, volBaseY - vHeight, candleWidth, vHeight);
    });

    // 4. Draw Candlesticks or Area Chart
    if (chartType === 'candlestick') {
      candles.forEach((c, idx) => {
        const x = getX(idx);
        const isGreen = c.close >= c.open;
        const color = isGreen ? COLOR_UP : COLOR_DOWN;

        // Wick
        const yHigh = getY(c.high);
        const yLow = getY(c.low);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, yHigh);
        ctx.lineTo(x, yLow);
        ctx.stroke();

        // Body
        const yOpen = getY(c.open);
        const yClose = getY(c.close);
        const bodyTop = Math.min(yOpen, yClose);
        const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1.5);

        ctx.fillStyle = color;
        ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
      });
    } else {
      // Area Chart
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + priceHeight);
      gradient.addColorStop(0, isDark ? 'rgba(0, 208, 156, 0.25)' : 'rgba(37, 99, 235, 0.25)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

      ctx.beginPath();
      ctx.moveTo(getX(0), getY(candles[0].close));
      for (let i = 1; i < candles.length; i++) {
        ctx.lineTo(getX(i), getY(candles[i].close));
      }
      ctx.lineTo(getX(candles.length - 1), padding.top + priceHeight);
      ctx.lineTo(getX(0), padding.top + priceHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Area stroke line
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(candles[0].close));
      for (let i = 1; i < candles.length; i++) {
        ctx.lineTo(getX(i), getY(candles[i].close));
      }
      ctx.strokeStyle = COLOR_UP;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 5. Draw SMA 20
    if (showSMA20) {
      ctx.strokeStyle = COLOR_SMA20;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let hasStarted = false;
      candles.forEach((c, idx) => {
        if (c.sma20) {
          const x = getX(idx);
          const y = getY(c.sma20);
          if (!hasStarted) {
            ctx.moveTo(x, y);
            hasStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
    }

    // 6. Draw SMA 50
    if (showSMA50) {
      ctx.strokeStyle = COLOR_SMA50;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let hasStarted = false;
      candles.forEach((c, idx) => {
        if (c.sma50) {
          const x = getX(idx);
          const y = getY(c.sma50);
          if (!hasStarted) {
            ctx.moveTo(x, y);
            hasStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });
      ctx.stroke();
    }

    // 7. Time / Date Ticks on X-Axis
    const numXTicks = isMobile ? 3 : 6;
    const step = Math.floor(candles.length / numXTicks);
    ctx.fillStyle = TEXT_COLOR;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    for (let i = 0; i < candles.length; i += step) {
      const x = getX(i);
      const dateStr = candles[i].time ? candles[i].time.split(' ')[0] : '';
      ctx.fillText(dateStr, x, height - padding.bottom + 16);
    }

    // 8. Crosshair and hover marker
    if (hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < candles.length) {
      const hX = getX(hoveredIndex);
      const hCandle = candles[hoveredIndex];
      const hY = getY(hCandle.close);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hX, padding.top);
      ctx.lineTo(hX, height - padding.bottom);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(padding.left, hY);
      ctx.lineTo(width - padding.right, hY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price badge on right axis
      ctx.fillStyle = '#2962FF';
      ctx.fillRect(width - padding.right, hY - 9, padding.right, 18);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${currencySymbol}${hCandle.close.toFixed(2)}`, width - padding.right + 4, hY + 4);
    }

  }, [candles, timeframe, chartType, showSMA20, showSMA50, showBollinger, hoveredIndex, dimensions, isDark]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !candles || candles.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const isMobile = rect.width < 540;
    const padding = { top: 12, right: isMobile ? 55 : 75, bottom: isMobile ? 28 : 36, left: isMobile ? 6 : 10 };
    const chartWidth = rect.width - padding.left - padding.right;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const mouseX = clientX - rect.left;
    const mouseY = clientY - rect.top;

    setMousePos({ x: mouseX, y: mouseY });

    if (mouseX >= padding.left && mouseX <= rect.width - padding.right) {
      const ratio = (mouseX - padding.left) / chartWidth;
      const idx = Math.round(ratio * (candles.length - 1));
      if (idx >= 0 && idx < candles.length) {
        setHoveredIndex(idx);
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const activeCandle = hoveredIndex !== null && candles[hoveredIndex] ? candles[hoveredIndex] : candles[candles.length - 1];

  return (
    <div className="p-4 sm:p-5 rounded-lg border border-slate-800 light:border-slate-200 bg-[#0C0D0E] light:bg-white shadow-sm flex flex-col gap-3 transition-colors">
      
      {/* Chart Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800/80 light:border-slate-200">
        
        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => onTimeframeChange(tf.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                timeframe === tf.value
                  ? 'bg-[#2962FF] text-white shadow-sm'
                  : 'text-slate-400 light:text-slate-600 hover:text-white light:hover:text-[#047857] hover:bg-slate-800 light:hover:bg-slate-100'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Chart Type & Indicator Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          
          {/* Chart Type Toggle */}
          <div className="flex items-center bg-[#141517] light:bg-slate-100 p-0.5 rounded-md border border-slate-800 light:border-slate-300">
            <button
              onClick={() => setChartType('candlestick')}
              title="Candlestick Chart"
              className={`p-1 rounded transition-all cursor-pointer ${
                chartType === 'candlestick'
                  ? 'bg-[#2962FF] text-white shadow-sm'
                  : 'text-slate-400 light:text-slate-600 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('area')}
              title="Area Line Chart"
              className={`p-1 rounded transition-all cursor-pointer ${
                chartType === 'area'
                  ? 'bg-[#2962FF] text-white shadow-sm'
                  : 'text-slate-400 light:text-slate-600 hover:text-white'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Indicator Toggles */}
          <button
            onClick={() => setShowSMA20(!showSMA20)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-mono transition-all cursor-pointer ${
              showSMA20
                ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30 font-bold'
                : 'bg-[#141517] light:bg-slate-100 text-slate-400 light:text-slate-600 border-slate-800 light:border-slate-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
            SMA 20
          </button>

          <button
            onClick={() => setShowSMA50(!showSMA50)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-mono transition-all cursor-pointer ${
              showSMA50
                ? 'bg-[#8B5CF6]/15 text-[#8B5CF6] border-[#8B5CF6]/30 font-bold'
                : 'bg-[#141517] light:bg-slate-100 text-slate-400 light:text-slate-600 border-slate-800 light:border-slate-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6]" />
            SMA 50
          </button>

          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-mono transition-all cursor-pointer ${
              showBollinger
                ? 'bg-[#2962FF]/15 text-[#2962FF] border-[#2962FF]/30 font-bold'
                : 'bg-[#141517] light:bg-slate-100 text-slate-400 light:text-slate-600 border-slate-800 light:border-slate-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2962FF]" />
            Bollinger (20,2)
          </button>
        </div>

      </div>

      {/* Floating Tooltip Header */}
      {activeCandle && (
        <div className="flex items-center gap-3 flex-wrap text-xs font-mono bg-[#141517] light:bg-slate-100 px-3 py-1.5 rounded-md border border-slate-800 light:border-slate-300 text-slate-300 light:text-slate-800">
          <span className="text-slate-400 light:text-slate-500 font-semibold">{activeCandle.time}</span>
          <div>O: <span className="text-white light:text-slate-900 font-bold tabular-nums">{currencySymbol}{activeCandle.open?.toFixed(2)}</span></div>
          <div>H: <span className="text-white light:text-slate-900 font-bold tabular-nums">{currencySymbol}{activeCandle.high?.toFixed(2)}</span></div>
          <div>L: <span className="text-white light:text-slate-900 font-bold tabular-nums">{currencySymbol}{activeCandle.low?.toFixed(2)}</span></div>
          <div>
            C:{' '}
            <span
              className={`font-bold tabular-nums ${
                activeCandle.close >= activeCandle.open ? 'text-profit' : 'text-loss'
              }`}
            >
              {currencySymbol}{activeCandle.close?.toFixed(2)}
            </span>
          </div>
          <div>Vol: <span className="text-slate-400 light:text-slate-500 font-semibold tabular-nums">{activeCandle.volume?.toLocaleString()}</span></div>
        </div>
      )}

      {/* Canvas Chart Area */}
      <div ref={containerRef} className="w-full h-[280px] xs:h-[320px] sm:h-[380px] md:h-[420px] lg:h-[460px] relative cursor-crosshair">
        {loading ? (
          <div className="w-full h-full skeleton-shimmer" />
        ) : (
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseLeave}
            className="w-full h-full block touch-none"
          />
        )}
      </div>

    </div>
  );
}
