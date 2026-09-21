import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  BarChart3,
  LineChart,
  Layers,
  Square,
  Trash2,
  RotateCcw,
  Palette,
  Check,
  Info,
  X
} from 'lucide-react';
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

export const DRAWING_PRESETS = [
  { id: 'demand', label: 'Demand / Support', hex: '#16A34A', bg: 'rgba(22, 163, 74, 0.18)', border: '#16A34A' },
  { id: 'supply', label: 'Supply / Resistance', hex: '#DC2626', bg: 'rgba(220, 38, 38, 0.18)', border: '#DC2626' },
  { id: 'channel', label: 'Consolidation / Channel', hex: '#2563EB', bg: 'rgba(37, 99, 235, 0.18)', border: '#2563EB' },
  { id: 'liquidity', label: 'Order Block / Liquidity', hex: '#D97706', bg: 'rgba(217, 119, 6, 0.18)', border: '#D97706' },
  { id: 'target', label: 'Target / Breakout Zone', hex: '#0284C7', bg: 'rgba(2, 132, 199, 0.18)', border: '#0284C7' },
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

  // Drawing Tools State
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(DRAWING_PRESETS[0]);
  const [boxes, setBoxes] = useState([]);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [hoveredBoxId, setHoveredBoxId] = useState(null);
  const [activeDrawBox, setActiveDrawBox] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Load persistent drawings per ticker from localStorage
  useEffect(() => {
    if (!ticker) return;
    try {
      const saved = localStorage.getItem(`papertrade_boxes_${ticker}`);
      if (saved) {
        setBoxes(JSON.parse(saved));
      } else {
        setBoxes([]);
      }
    } catch (e) {
      console.warn('Failed to load chart drawings:', e);
      setBoxes([]);
    }
    setSelectedBoxId(null);
    setActiveDrawBox(null);
  }, [ticker]);

  // Save persistent drawings per ticker
  const saveBoxes = useCallback((newBoxes) => {
    setBoxes(newBoxes);
    if (ticker) {
      try {
        localStorage.setItem(`papertrade_boxes_${ticker}`, JSON.stringify(newBoxes));
      } catch (e) {
        console.warn('Failed to save chart drawings:', e);
      }
    }
  }, [ticker]);

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

  // Keyboard Shortcuts (Delete, Esc, Undo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        if (activeDrawBox) {
          setActiveDrawBox(null);
        } else if (selectedBoxId) {
          setSelectedBoxId(null);
        } else if (isDrawMode) {
          setIsDrawMode(false);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBoxId) {
          e.preventDefault();
          saveBoxes(boxes.filter((b) => b.id !== selectedBoxId));
          setSelectedBoxId(null);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (boxes.length > 0) {
          e.preventDefault();
          saveBoxes(boxes.slice(0, -1));
          setSelectedBoxId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBoxId, activeDrawBox, isDrawMode, boxes, saveBoxes]);

  // Render chart and interactive squares on canvas
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

    // Option C Theme Palette
    const COLOR_UP = '#16A34A'; // Green for bull candles
    const COLOR_DOWN = '#DC2626'; // Red for bear candles
    const COLOR_SMA20 = '#D97706'; // Amber
    const COLOR_SMA50 = '#64748B'; // Slate
    const COLOR_BOLLINGER = '#2563EB'; // Slate Blue Accent
    const GRID_COLOR = isDark ? 'rgba(51, 65, 85, 0.4)' : 'rgba(229, 231, 235, 0.8)';
    const TEXT_COLOR = isDark ? '#94A3B8' : '#64748B';

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
      // Area Chart (Flat solid fill, no gradient)
      ctx.beginPath();
      ctx.moveTo(getX(0), getY(candles[0].close));
      for (let i = 1; i < candles.length; i++) {
        ctx.lineTo(getX(i), getY(candles[i].close));
      }
      ctx.lineTo(getX(candles.length - 1), padding.top + priceHeight);
      ctx.lineTo(getX(0), padding.top + priceHeight);
      ctx.closePath();
      ctx.fillStyle = 'rgba(37, 99, 235, 0.08)';
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

    // 7. Draw Saved Squares / Boxes (Trading Zones)
    boxes.forEach((box) => {
      let sIdx = box.startIdx;
      let eIdx = box.endIdx;
      if (box.startTime) {
        const foundS = candles.findIndex((c) => c.time === box.startTime);
        if (foundS !== -1) sIdx = foundS;
      }
      if (box.endTime) {
        const foundE = candles.findIndex((c) => c.time === box.endTime);
        if (foundE !== -1) eIdx = foundE;
      }
      sIdx = Math.max(0, Math.min(candles.length - 1, sIdx ?? 0));
      eIdx = Math.max(0, Math.min(candles.length - 1, eIdx ?? candles.length - 1));

      const xLeft = getX(Math.min(sIdx, eIdx));
      const xRight = getX(Math.max(sIdx, eIdx));
      const yTop = getY(Math.max(box.priceTop, box.priceBottom));
      const yBottom = getY(Math.min(box.priceTop, box.priceBottom));

      const bWidth = Math.max(xRight - xLeft, 12);
      const bHeight = Math.max(yBottom - yTop, 6);

      const isSelected = selectedBoxId === box.id;
      const isHovered = hoveredBoxId === box.id;

      // Filled zone
      ctx.fillStyle = box.bg || `${box.color}2e`;
      ctx.fillRect(xLeft, yTop, bWidth, bHeight);

      // Border outline
      ctx.strokeStyle = box.border || box.color;
      ctx.lineWidth = isSelected ? 2 : (isHovered ? 1.8 : 1.2);
      if (isSelected) {
        ctx.setLineDash([4, 2]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.strokeRect(xLeft, yTop, bWidth, bHeight);
      ctx.setLineDash([]);

      // Corner handles if selected
      if (isSelected) {
        const handleSize = 6;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = box.color;
        ctx.lineWidth = 1.5;
        [
          [xLeft, yTop],
          [xLeft + bWidth, yTop],
          [xLeft, yTop + bHeight],
          [xLeft + bWidth, yTop + bHeight]
        ].forEach(([hx, hy]) => {
          ctx.fillRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
          ctx.strokeRect(hx - handleSize / 2, hy - handleSize / 2, handleSize, handleSize);
        });
      }

      // Zone Tag / Price Range
      const minP = Math.min(box.priceTop, box.priceBottom);
      const maxP = Math.max(box.priceTop, box.priceBottom);
      const delta = maxP - minP;
      const pctDiff = ((delta / (minP || 1)) * 100).toFixed(1);
      const tagText = `${box.label ? box.label + ': ' : ''}${currencySymbol}${minP.toFixed(2)} - ${currencySymbol}${maxP.toFixed(2)} (Δ ${pctDiff}%)`;

      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      const textWidth = ctx.measureText(tagText).width;
      const badgeY = Math.max(padding.top + 2, yTop - 15);
      
      ctx.fillStyle = isDark ? 'rgba(12, 13, 14, 0.9)' : 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(xLeft, badgeY, textWidth + 8, 14);
      ctx.strokeStyle = box.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(xLeft, badgeY, textWidth + 8, 14);

      ctx.fillStyle = box.color;
      ctx.textAlign = 'left';
      ctx.fillText(tagText, xLeft + 4, badgeY + 10);
    });

    // 8. Draw Active Live Preview Box (While Dragging)
    if (activeDrawBox) {
      const { startX, startY, currentX, currentY, startPrice, currentPrice } = activeDrawBox;
      const xMin = Math.min(startX, currentX);
      const xMax = Math.max(startX, currentX);
      const yMin = Math.min(startY, currentY);
      const yMax = Math.max(startY, currentY);
      const w = Math.max(xMax - xMin, 6);
      const h = Math.max(yMax - yMin, 4);

      // Translucent fill
      ctx.fillStyle = selectedPreset.bg;
      ctx.fillRect(xMin, yMin, w, h);

      // Live animated dashed border
      ctx.strokeStyle = selectedPreset.border;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(xMin, yMin, w, h);
      ctx.setLineDash([]);

      // Live price delta tag
      const pTop = Math.max(startPrice, currentPrice);
      const pBottom = Math.min(startPrice, currentPrice);
      const delta = pTop - pBottom;
      const deltaPct = ((delta / (pBottom || 1)) * 100).toFixed(2);
      const liveTag = `${selectedPreset.label}: ${currencySymbol}${pBottom.toFixed(2)} – ${currencySymbol}${pTop.toFixed(2)} (Δ ${currencySymbol}${delta.toFixed(2)} / ${deltaPct}%)`;

      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      const tWidth = ctx.measureText(liveTag).width;
      const bY = Math.max(padding.top + 2, yMin - 18);

      ctx.fillStyle = isDark ? '#141517' : '#FFFFFF';
      ctx.fillRect(xMin, bY, tWidth + 10, 16);
      ctx.strokeStyle = selectedPreset.hex;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(xMin, bY, tWidth + 10, 16);
      ctx.fillStyle = selectedPreset.hex;
      ctx.textAlign = 'left';
      ctx.fillText(liveTag, xMin + 5, bY + 12);
    }

    // 9. Time / Date Ticks on X-Axis
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

    // 10. Crosshair and hover marker (when not drawing actively)
    if (!activeDrawBox && hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < candles.length) {
      const hX = getX(hoveredIndex);
      const hCandle = candles[hoveredIndex];
      const hY = getY(hCandle.close);

      ctx.strokeStyle = isDrawMode ? selectedPreset.hex : 'rgba(148, 163, 184, 0.4)';
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
      ctx.fillStyle = isDrawMode ? selectedPreset.hex : '#2962FF';
      ctx.fillRect(width - padding.right, hY - 9, padding.right, 18);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`${currencySymbol}${hCandle.close.toFixed(2)}`, width - padding.right + 4, hY + 4);
    }

  }, [
    candles,
    timeframe,
    chartType,
    showSMA20,
    showSMA50,
    showBollinger,
    hoveredIndex,
    dimensions,
    isDark,
    boxes,
    selectedBoxId,
    hoveredBoxId,
    activeDrawBox,
    isDrawMode,
    selectedPreset,
    currencySymbol
  ]);

  // Coordinate Conversion Helpers
  const getCoordinatesFromEvent = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !candles || candles.length === 0) return null;

    const rect = canvas.getBoundingClientRect();
    const isMobile = rect.width < 540;
    const padding = { top: 12, right: isMobile ? 55 : 75, bottom: isMobile ? 28 : 36, left: isMobile ? 6 : 10 };
    const chartHeight = rect.height - padding.top - padding.bottom;
    const volumeHeight = isMobile ? 24 : 35;
    const priceHeight = chartHeight - volumeHeight - (isMobile ? 6 : 12);
    const chartWidth = rect.width - padding.left - padding.right;

    const clientX = e.touches && e.touches[0] ? e.touches[0].clientX : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : e.clientX);
    const clientY = e.touches && e.touches[0] ? e.touches[0].clientY : (e.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : e.clientY);

    const mouseX = Math.max(padding.left, Math.min(rect.width - padding.right, clientX - rect.left));
    const mouseY = Math.max(padding.top, Math.min(padding.top + priceHeight, clientY - rect.top));

    // Calculate Price Range
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    candles.forEach((c) => {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (showBollinger && c.bb_lower && c.bb_lower < minPrice) minPrice = c.bb_lower;
      if (showBollinger && c.bb_upper && c.bb_upper > maxPrice) maxPrice = c.bb_upper;
    });
    const priceBuffer = (maxPrice - minPrice) * 0.05 || 1;
    minPrice -= priceBuffer;
    maxPrice += priceBuffer;
    const priceRange = maxPrice - minPrice || 1;

    const price = minPrice + ((padding.top + priceHeight - mouseY) / priceHeight) * priceRange;
    const ratio = (mouseX - padding.left) / chartWidth;
    const idx = Math.max(0, Math.min(candles.length - 1, Math.round(ratio * (candles.length - 1))));

    return { mouseX, mouseY, price, idx, time: candles[idx]?.time || '' };
  };

  const handleMouseDown = (e) => {
    const coords = getCoordinatesFromEvent(e);
    if (!coords) return;

    if (isDrawMode) {
      setActiveDrawBox({
        startX: coords.mouseX,
        startY: coords.mouseY,
        currentX: coords.mouseX,
        currentY: coords.mouseY,
        startPrice: coords.price,
        currentPrice: coords.price,
        startIdx: coords.idx,
        currentIdx: coords.idx,
        startTime: coords.time,
        currentTime: coords.time
      });
      setSelectedBoxId(null);
    } else {
      // Check if clicking inside an existing box to select it
      const clicked = [...boxes].reverse().find((b) => {
        const minP = Math.min(b.priceTop, b.priceBottom);
        const maxP = Math.max(b.priceTop, b.priceBottom);
        const minIdx = Math.min(b.startIdx, b.endIdx);
        const maxIdx = Math.max(b.startIdx, b.endIdx);
        return coords.price >= minP && coords.price <= maxP && coords.idx >= minIdx && coords.idx <= maxIdx;
      });
      setSelectedBoxId(clicked ? clicked.id : null);
    }
  };

  const handleMouseMove = (e) => {
    const coords = getCoordinatesFromEvent(e);
    if (!coords) return;

    setMousePos({ x: coords.mouseX, y: coords.mouseY });

    if (isDrawMode && activeDrawBox) {
      setActiveDrawBox((prev) => ({
        ...prev,
        currentX: coords.mouseX,
        currentY: coords.mouseY,
        currentPrice: coords.price,
        currentIdx: coords.idx,
        currentTime: coords.time
      }));
    } else {
      setHoveredIndex(coords.idx);

      // Check hover on boxes
      const hovered = [...boxes].reverse().find((b) => {
        const minP = Math.min(b.priceTop, b.priceBottom);
        const maxP = Math.max(b.priceTop, b.priceBottom);
        const minIdx = Math.min(b.startIdx, b.endIdx);
        const maxIdx = Math.max(b.startIdx, b.endIdx);
        return coords.price >= minP && coords.price <= maxP && coords.idx >= minIdx && coords.idx <= maxIdx;
      });
      setHoveredBoxId(hovered ? hovered.id : null);
    }
  };

  const handleMouseUp = (e) => {
    if (isDrawMode && activeDrawBox) {
      const coords = getCoordinatesFromEvent(e) || activeDrawBox;
      const priceTop = Math.max(activeDrawBox.startPrice, coords.price);
      const priceBottom = Math.min(activeDrawBox.startPrice, coords.price);
      const startIdx = Math.min(activeDrawBox.startIdx, coords.idx);
      const endIdx = Math.max(activeDrawBox.startIdx, coords.idx);

      const pixelDist = Math.hypot(
        coords.mouseX - activeDrawBox.startX,
        coords.mouseY - activeDrawBox.startY
      );

      // Only save if drawn rectangle has meaningful size (at least 6px)
      if (pixelDist > 6) {
        const newBox = {
          id: 'box_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          priceTop: Math.round(priceTop * 100) / 100,
          priceBottom: Math.round(priceBottom * 100) / 100,
          startTime: candles[startIdx]?.time || activeDrawBox.startTime,
          endTime: candles[endIdx]?.time || coords.time,
          startIdx,
          endIdx,
          color: selectedPreset.hex,
          border: selectedPreset.border,
          bg: selectedPreset.bg,
          label: selectedPreset.label,
          createdAt: new Date().toISOString()
        };

        const updated = [...boxes, newBox];
        saveBoxes(updated);
        setSelectedBoxId(newBox.id);
      }

      setActiveDrawBox(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
    setHoveredBoxId(null);
    if (activeDrawBox) {
      setActiveDrawBox(null);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedBoxId) {
      saveBoxes(boxes.filter((b) => b.id !== selectedBoxId));
      setSelectedBoxId(null);
    }
  };

  const handleClearAll = () => {
    saveBoxes([]);
    setSelectedBoxId(null);
    setActiveDrawBox(null);
  };

  const handleUndo = () => {
    if (boxes.length > 0) {
      saveBoxes(boxes.slice(0, -1));
      setSelectedBoxId(null);
    }
  };

  const activeCandle = hoveredIndex !== null && candles[hoveredIndex] ? candles[hoveredIndex] : candles[candles.length - 1];

  return (
    <div className="p-4 sm:p-5 rounded-lg border border-slate-200 bg-white shadow-sm flex flex-col gap-3 transition-colors">
      
      {/* 1. Main Chart Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-200">
        
        {/* Timeframe Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => onTimeframeChange(tf.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                timeframe === tf.value
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Chart Type, Indicators & Drawing Tool Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          
          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
            <button
              onClick={() => setChartType('candlestick')}
              title="Candlestick Chart"
              className={`p-1 rounded transition-all cursor-pointer ${
                chartType === 'candlestick'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('area')}
              title="Area Line Chart"
              className={`p-1 rounded transition-all cursor-pointer ${
                chartType === 'area'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
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
                ? 'bg-[#D97706]/15 text-[#D97706] border-[#D97706]/30 font-bold'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
            SMA 20
          </button>

          <button
            onClick={() => setShowSMA50(!showSMA50)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-mono transition-all cursor-pointer ${
              showSMA50
                ? 'bg-slate-200 text-slate-800 border-slate-300 font-bold'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            SMA 50
          </button>

          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-mono transition-all cursor-pointer ${
              showBollinger
                ? 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/30 font-bold'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            Bollinger (20,2)
          </button>

          {/* Square / Box Drawing Tool Button */}
          <button
            onClick={() => setIsDrawMode(!isDrawMode)}
            title="Draw Rectangle / Support & Resistance Zones (Click & Drag)"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono font-bold transition-all cursor-pointer shadow-sm ${
              isDrawMode
                ? 'bg-[#2563EB] text-white border-[#2563EB] ring-2 ring-[#2563EB]/30'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-[#2563EB]'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Draw Square</span>
            {boxes.length > 0 && (
              <span className={`text-[10px] px-1 rounded font-mono ${isDrawMode ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {boxes.length}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* 2. Drawing Sub-Toolbar (When Draw Mode is Active or Drawings Exist) */}
      {(isDrawMode || boxes.length > 0) && (
        <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-slate-50 border border-slate-200 flex-wrap text-xs font-mono">
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase font-bold text-slate-600 flex items-center gap-1">
              <Square className="w-3 h-3 text-[#2563EB]" />
              <span>Zone Type:</span>
            </span>

            {/* Color & Zone Type Pills */}
            <div className="flex items-center gap-1 flex-wrap">
              {DRAWING_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPreset(p);
                    if (!isDrawMode) setIsDrawMode(true);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer border ${
                    selectedPreset.id === p.id && isDrawMode
                      ? 'border-slate-800 text-white shadow-sm'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                  style={{
                    backgroundColor: selectedPreset.id === p.id && isDrawMode ? p.hex : 'transparent'
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.hex }} />
                  <span>{p.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons (Undo, Delete Selected, Clear All) */}
          <div className="flex items-center gap-1.5">
            {selectedBoxId && (
              <button
                onClick={handleDeleteSelected}
                className="px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Delete Selected Square (Delete Key)"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete Box</span>
              </button>
            )}

            {boxes.length > 0 && (
              <>
                <button
                  onClick={handleUndo}
                  className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                  title="Undo Last Square (Ctrl+Z)"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Undo</span>
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-red-600 text-[11px] font-bold transition-colors cursor-pointer"
                  title="Clear all drawn zones on this chart"
                >
                  Clear ({boxes.length})
                </button>
              </>
            )}

            {isDrawMode && (
              <button
                onClick={() => setIsDrawMode(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                title="Exit Draw Mode (ESC)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>
      )}

      {/* 3. Floating Tooltip Header */}
      {activeCandle && (
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 text-slate-700">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-500 font-semibold">{activeCandle.time}</span>
            <div>O: <span className="text-slate-900 font-bold tabular-nums">{currencySymbol}{activeCandle.open?.toFixed(2)}</span></div>
            <div>H: <span className="text-slate-900 font-bold tabular-nums">{currencySymbol}{activeCandle.high?.toFixed(2)}</span></div>
            <div>L: <span className="text-slate-900 font-bold tabular-nums">{currencySymbol}{activeCandle.low?.toFixed(2)}</span></div>
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
            <div>Vol: <span className="text-slate-500 font-semibold tabular-nums">{activeCandle.volume?.toLocaleString()}</span></div>
          </div>

          {isDrawMode && (
            <span className="text-[11px] font-mono text-[#2563EB] bg-[#2563EB]/10 px-2 py-0.5 rounded border border-[#2563EB]/25 font-bold hidden sm:inline-block">
              Click & drag across chart to draw {selectedPreset.label}
            </span>
          )}
        </div>
      )}

      {/* 4. Canvas Chart Area */}
      <div
        ref={containerRef}
        className={`w-full h-[280px] xs:h-[320px] sm:h-[380px] md:h-[420px] lg:h-[460px] relative select-none ${
          isDrawMode ? 'cursor-crosshair' : 'cursor-crosshair'
        }`}
      >
        {loading ? (
          <div className="w-full h-full skeleton-shimmer" />
        ) : (
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            className="w-full h-full block touch-none"
          />
        )}
      </div>

    </div>
  );
}
