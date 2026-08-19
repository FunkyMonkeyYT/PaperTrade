import io
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple, Union
import yfinance as yf
import pandas as pd
import numpy as np

from models.schemas import (
    StockMetricsResponse,
    KeyMetrics,
    IndicatorValues,
    BollingerBandsData,
    QuantScoreCard,
    CandleStick
)
from utils.cache import metrics_cache

logger = logging.getLogger("quant_engine")
logging.basicConfig(level=logging.INFO)

class QuantEngine:
    """
    Mathematical Quantitative Engine.
    Computes 20/50 SMA, 14-day RSI, MACD, Bollinger Bands, and Annualized Volatility.
    Supports structured dataset export for machine learning pipelines.
    """

    @staticmethod
    def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
        """Calculates 14-period Relative Strength Index using Wilder's smoothing."""
        delta = series.diff()
        gain = delta.clip(lower=0)
        loss = -1 * delta.clip(upper=0)
        
        avg_gain = gain.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
        avg_loss = loss.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
        
        rs = avg_gain / avg_loss.replace(0, np.nan)
        rsi = 100 - (100 / (1 + rs))
        return rsi.fillna(50.0)

    @staticmethod
    def calculate_macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """Calculates MACD Line, Signal Line, and Histogram."""
        ema_fast = series.ewm(span=fast, adjust=False).mean()
        ema_slow = series.ewm(span=slow, adjust=False).mean()
        macd_line = ema_fast - ema_slow
        macd_signal = macd_line.ewm(span=signal, adjust=False).mean()
        macd_hist = macd_line - macd_signal
        return macd_line, macd_signal, macd_hist

    @staticmethod
    def calculate_bollinger_bands(series: pd.Series, window: int = 20, num_std: float = 2.0) -> Tuple[pd.Series, pd.Series, pd.Series, pd.Series, pd.Series]:
        """
        Calculates Bollinger Bands: Middle (SMA20), Upper (+2std), Lower (-2std),
        Bandwidth ((Upper - Lower) / Middle), and %B ((Price - Lower) / (Upper - Lower)).
        """
        middle = series.rolling(window=window).mean()
        std = series.rolling(window=window).std()
        upper = middle + (std * num_std)
        lower = middle - (std * num_std)
        bandwidth = (upper - lower) / middle.replace(0, np.nan)
        percent_b = (series - lower) / (upper - lower).replace(0, np.nan)
        return upper, middle, lower, bandwidth, percent_b

    @staticmethod
    def calculate_annualized_volatility(series: pd.Series, window: int = 30, trading_days: int = 252) -> float:
        """Calculates 30-day annualized historical volatility percentage."""
        daily_returns = series.pct_change().dropna()
        if len(daily_returns) < window:
            sample = daily_returns
        else:
            sample = daily_returns.iloc[-window:]
        
        if len(sample) < 2:
            return 0.0
            
        daily_std = sample.std()
        annualized_vol = float(daily_std * np.sqrt(trading_days) * 100)
        return round(annualized_vol, 2)

    @classmethod
    def get_stock_metrics(cls, ticker: str, timeframe: str = "1y", force_refresh: bool = False) -> StockMetricsResponse:
        """
        Fetches historical data, computes indicators (SMA, RSI, MACD, Bollinger Bands, Volatility),
        and returns strongly-typed metrics response.
        """
        clean_ticker = ticker.strip().upper()
        cache_key = f"metrics:{clean_ticker}:{timeframe}"

        if not force_refresh:
            cached_data = metrics_cache.get(cache_key)
            if cached_data is not None:
                cached_data.cached = True
                return cached_data

        logger.info(f"Computing quantitative metrics for {clean_ticker} (timeframe: {timeframe})")
        
        period_map = {
            "1d": "1d",
            "5d": "5d",
            "1m": "1mo",
            "6m": "6mo",
            "1y": "1y",
            "5y": "5y"
        }
        yf_period = period_map.get(timeframe.lower(), "1y")
        interval_map = {
            "1d": "5m",
            "5d": "15m",
            "1m": "1d",
            "6m": "1d",
            "1y": "1d",
            "5y": "1wk"
        }
        yf_interval = interval_map.get(timeframe.lower(), "1d")

        stock = yf.Ticker(clean_ticker)
        fetch_period = "2y" if yf_period in ["1mo", "6mo", "1y"] else yf_period
        hist = stock.history(period=fetch_period, interval=yf_interval)

        if hist.empty:
            hist = stock.history(period="1y", interval="1d")
            if hist.empty:
                raise ValueError(f"No market data found for symbol '{clean_ticker}'.")

        if isinstance(hist.columns, pd.MultiIndex):
            hist.columns = hist.columns.get_level_values(0)

        close = hist["Close"]

        # Moving Averages
        hist["SMA20"] = close.rolling(window=20).mean()
        hist["SMA50"] = close.rolling(window=50).mean()
        hist["SMA200"] = close.rolling(window=200).mean()

        # RSI
        hist["RSI14"] = cls.calculate_rsi(close, period=14)

        # MACD
        macd_line, macd_signal, macd_hist = cls.calculate_macd(close)
        hist["MACD_Line"] = macd_line
        hist["MACD_Signal"] = macd_signal
        hist["MACD_Hist"] = macd_hist

        # Bollinger Bands
        bb_upper, bb_middle, bb_lower, bb_width, bb_pct_b = cls.calculate_bollinger_bands(close, window=20, num_std=2.0)
        hist["BB_Upper"] = bb_upper
        hist["BB_Middle"] = bb_middle
        hist["BB_Lower"] = bb_lower
        hist["BB_Width"] = bb_width
        hist["BB_PctB"] = bb_pct_b

        latest = hist.iloc[-1]
        prev = hist.iloc[-2] if len(hist) > 1 else latest

        current_price = round(float(latest["Close"]), 2)
        open_price = round(float(latest["Open"]), 2)
        day_high = round(float(latest["High"]), 2)
        day_low = round(float(latest["Low"]), 2)
        previous_close = round(float(prev["Close"]), 2)

        change_amount = round(current_price - previous_close, 2)
        change_percentage = round((change_amount / previous_close * 100) if previous_close else 0.0, 2)
        volume = int(latest["Volume"])

        # Fetch ticker metadata safely
        info: Dict[str, Any] = {}
        try:
            info = stock.info or {}
        except Exception as e:
            logger.warning(f"Could not load metadata for {clean_ticker}: {e}")

        # Check known curated universe for reliable fallback metadata
        known_item = next((item for item in cls._get_known_universe() if item["ticker"].upper() == clean_ticker), None)

        company_name = (
            info.get("shortName")
            or info.get("longName")
            or (known_item["name"] if known_item else None)
            or clean_ticker
        )
        sector = (
            info.get("sector")
            or (known_item["sector"] if known_item else None)
            or "Equities"
        )
        industry = info.get("industry", "Financial Asset")
        market_cap = info.get("marketCap")
        pe_ratio = info.get("trailingPE") or info.get("forwardPE")
        beta = info.get("beta")
        fifty_two_week_high = float(info.get("fiftyTwoWeekHigh") or hist["High"].max())
        fifty_two_week_low = float(info.get("fiftyTwoWeekLow") or hist["Low"].min())
        fifty_two_week_change = info.get("52WeekChange")
        avg_volume_10d = info.get("averageVolume10days")
        currency = cls.infer_currency_from_ticker(clean_ticker, info.get("currency"))
        exchange = cls.infer_exchange_from_ticker(clean_ticker, info.get("exchange"))

        # Indicator values
        sma20_val = round(float(latest["SMA20"]) if pd.notna(latest["SMA20"]) else current_price, 2)
        sma50_val = round(float(latest["SMA50"]) if pd.notna(latest["SMA50"]) else current_price, 2)
        sma200_val = round(float(latest["SMA200"]), 2) if pd.notna(latest["SMA200"]) else None

        rsi14_val = round(float(latest["RSI14"]) if pd.notna(latest["RSI14"]) else 50.0, 2)
        rsi_status = "Overbought" if rsi14_val >= 70 else ("Oversold" if rsi14_val <= 30 else "Neutral")

        macd_l = round(float(latest["MACD_Line"]) if pd.notna(latest["MACD_Line"]) else 0.0, 2)
        macd_s = round(float(latest["MACD_Signal"]) if pd.notna(latest["MACD_Signal"]) else 0.0, 2)
        macd_h = round(float(latest["MACD_Hist"]) if pd.notna(latest["MACD_Hist"]) else 0.0, 2)

        if macd_h > 0 and macd_l > macd_s:
            macd_crossover = "Bullish Crossover"
        elif macd_h < 0 and macd_l < macd_s:
            macd_crossover = "Bearish Crossover"
        else:
            macd_crossover = "Neutral"

        # Bollinger Bands Data
        bb_u = round(float(latest["BB_Upper"]) if pd.notna(latest["BB_Upper"]) else current_price * 1.05, 2)
        bb_m = round(float(latest["BB_Middle"]) if pd.notna(latest["BB_Middle"]) else current_price, 2)
        bb_l = round(float(latest["BB_Lower"]) if pd.notna(latest["BB_Lower"]) else current_price * 0.95, 2)
        bb_bw = round(float(latest["BB_Width"] * 100) if pd.notna(latest["BB_Width"]) else 10.0, 2)
        bb_pb = round(float(latest["BB_PctB"]) if pd.notna(latest["BB_PctB"]) else 0.5, 2)

        if bb_pb >= 1.0:
            bb_status = "Overbought (Upper Band Tag)"
        elif bb_pb <= 0.0:
            bb_status = "Oversold (Lower Band Tag)"
        elif bb_bw < 8.0:
            bb_status = "Band Squeeze (Volatility Compression)"
        else:
            bb_status = "Within Normal Range"

        vol_30d = cls.calculate_annualized_volatility(close, window=30)
        if vol_30d < 20:
            vol_status = "Low"
        elif vol_30d < 40:
            vol_status = "Moderate"
        elif vol_30d < 65:
            vol_status = "High"
        else:
            vol_status = "Extreme"

        # Support & Resistance levels
        recent_20 = hist.iloc[-20:] if len(hist) >= 20 else hist
        h20 = float(recent_20["High"].max())
        l20 = float(recent_20["Low"].min())
        pivot = (h20 + l20 + current_price) / 3
        resistance_level = round(2 * pivot - l20, 2)
        support_level = round(2 * pivot - h20, 2)

        # SMA Alignment
        if current_price > sma20_val > sma50_val:
            sma_alignment = "Strong Bullish"
        elif sma20_val > sma50_val:
            sma_alignment = "Bullish (Golden Cross Trend)"
        elif current_price < sma20_val < sma50_val:
            sma_alignment = "Strong Bearish"
        elif sma20_val < sma50_val:
            sma_alignment = "Bearish (Death Cross Trend)"
        else:
            sma_alignment = "Neutral / Consolidating"

        # Purely Algorithmic Quant Scoring Engine (0 - 100)
        trend_score = 50.0
        if current_price > sma20_val:
            trend_score += 25.0
        else:
            trend_score -= 20.0
        if current_price > sma50_val:
            trend_score += 25.0
        else:
            trend_score -= 20.0
        trend_score = float(np.clip(trend_score, 0, 100))

        momentum_score = 50.0
        if 50 <= rsi14_val <= 68:
            momentum_score += 25.0
        elif rsi14_val > 68:
            momentum_score += 10.0
        elif 35 <= rsi14_val < 50:
            momentum_score -= 10.0
        else:
            momentum_score -= 25.0

        if macd_h > 0:
            momentum_score += 20.0
        else:
            momentum_score -= 20.0
        momentum_score = float(np.clip(momentum_score, 0, 100))

        volatility_score = float(np.clip(100 - (vol_30d * 1.2), 10, 95))
        composite_score = round(0.40 * trend_score + 0.40 * momentum_score + 0.20 * volatility_score, 1)

        if composite_score >= 78 and rsi14_val < 72:
            verdict = "Strong Buy"
            confidence = 88
        elif composite_score >= 60 and rsi14_val < 75:
            verdict = "Buy"
            confidence = 82
        elif composite_score <= 25 or (rsi14_val > 78 and macd_h < 0):
            verdict = "Sell"
            confidence = 85
        elif composite_score <= 40:
            verdict = "Underperform"
            confidence = 75
        else:
            verdict = "Hold"
            confidence = 72

        sym_map = {"INR": "₹", "USD": "$", "GBP": "£", "EUR": "€", "JPY": "¥", "HKD": "HK$", "CAD": "CA$", "AUD": "A$", "CHF": "CHF "}
        curr_sym = sym_map.get(currency, "$")
        algo_summary = (
            f"Mathematical analysis indicates a {verdict.upper()} profile. Price is trading "
            f"{'above' if current_price > sma20_val else 'below'} 20-day SMA ({curr_sym}{sma20_val}) with 14-day RSI at {rsi14_val} "
            f"and Bollinger Band status '{bb_status}'. 30-day annualized volatility is {vol_30d}%."
        )

        display_hist = hist.iloc[-120:] if len(hist) > 120 else hist
        candles: List[CandleStick] = []
        for idx, row in display_hist.iterrows():
            time_str = idx.strftime("%Y-%m-%d %H:%M") if hasattr(idx, "strftime") else str(idx)
            candles.append(CandleStick(
                time=time_str,
                open=round(float(row["Open"]), 2),
                high=round(float(row["High"]), 2),
                low=round(float(row["Low"]), 2),
                close=round(float(row["Close"]), 2),
                volume=round(float(row["Volume"]), 0),
                sma20=round(float(row["SMA20"]), 2) if pd.notna(row["SMA20"]) else None,
                sma50=round(float(row["SMA50"]), 2) if pd.notna(row["SMA50"]) else None,
                bb_upper=round(float(row["BB_Upper"]), 2) if pd.notna(row["BB_Upper"]) else None,
                bb_middle=round(float(row["BB_Middle"]), 2) if pd.notna(row["BB_Middle"]) else None,
                bb_lower=round(float(row["BB_Lower"]), 2) if pd.notna(row["BB_Lower"]) else None,
            ))

        response = StockMetricsResponse(
            ticker=clean_ticker,
            company_name=company_name,
            timeframe=timeframe,
            metrics=KeyMetrics(
                current_price=current_price,
                previous_close=previous_close,
                open_price=open_price,
                day_high=day_high,
                day_low=day_low,
                change_amount=change_amount,
                change_percentage=change_percentage,
                volume=volume,
                avg_volume_10d=avg_volume_10d,
                market_cap=market_cap,
                pe_ratio=pe_ratio,
                fifty_two_week_high=round(fifty_two_week_high, 2),
                fifty_two_week_low=round(fifty_two_week_low, 2),
                fifty_two_week_change=fifty_two_week_change,
                beta=beta,
                currency=currency,
                exchange=exchange,
                company_name=company_name,
                sector=sector,
                industry=industry
            ),
            indicators=IndicatorValues(
                sma20=sma20_val,
                sma50=sma50_val,
                sma200=sma200_val,
                rsi14=rsi14_val,
                rsi_status=rsi_status,
                macd_line=macd_l,
                macd_signal=macd_s,
                macd_histogram=macd_h,
                macd_crossover=macd_crossover,
                bollinger_bands=BollingerBandsData(
                    upper=bb_u,
                    middle=bb_m,
                    lower=bb_l,
                    bandwidth=bb_bw,
                    percent_b=bb_pb,
                    status=bb_status
                ),
                volatility_30d_annualized=vol_30d,
                volatility_status=vol_status,
                support_level=support_level,
                resistance_level=resistance_level,
                sma_alignment=sma_alignment
            ),
            quant_scores=QuantScoreCard(
                trend_score=trend_score,
                momentum_score=momentum_score,
                volatility_score=volatility_score,
                composite_score=composite_score,
                verdict=verdict,
                confidence_score=confidence,
                algorithmic_summary=algo_summary
            ),
            candles=candles,
            cached=False,
            timestamp=datetime.utcnow().isoformat()
        )

        metrics_cache.set(cache_key, response)
        return response

    @classmethod
    def export_dataset(cls, ticker: str, timeframe: str = "2y", export_format: str = "csv") -> Tuple[Union[str, List[Dict[str, Any]]], str]:
        """
        Exports clean historical price and computed technical indicators as CSV or JSON
        for external machine learning and quantitative research models.
        """
        clean_ticker = ticker.strip().upper()
        stock = yf.Ticker(clean_ticker)
        hist = stock.history(period=timeframe, interval="1d")

        if hist.empty:
            raise ValueError(f"No data available to export for ticker '{clean_ticker}'.")

        if isinstance(hist.columns, pd.MultiIndex):
            hist.columns = hist.columns.get_level_values(0)

        close = hist["Close"]
        hist["SMA_20"] = close.rolling(window=20).mean()
        hist["SMA_50"] = close.rolling(window=50).mean()
        hist["SMA_200"] = close.rolling(window=200).mean()
        hist["RSI_14"] = cls.calculate_rsi(close, period=14)
        
        macd_line, macd_signal, macd_hist = cls.calculate_macd(close)
        hist["MACD_Line"] = macd_line
        hist["MACD_Signal"] = macd_signal
        hist["MACD_Hist"] = macd_hist

        bb_upper, bb_middle, bb_lower, bb_width, bb_pct_b = cls.calculate_bollinger_bands(close, window=20)
        hist["BB_Upper"] = bb_upper
        hist["BB_Middle"] = bb_middle
        hist["BB_Lower"] = bb_lower
        hist["BB_Bandwidth"] = bb_width
        hist["BB_PctB"] = bb_pct_b

        # Returns & Volatility
        hist["Daily_Return"] = close.pct_change()
        hist["Log_Return"] = np.log(close / close.shift(1))
        hist["Rolling_Vol_30d"] = hist["Daily_Return"].rolling(window=30).std() * np.sqrt(252)

        # Clean output DataFrame
        export_df = hist.reset_index()
        export_df["Date"] = export_df["Date"].astype(str)
        cols_to_keep = [
            "Date", "Open", "High", "Low", "Close", "Volume",
            "SMA_20", "SMA_50", "SMA_200", "RSI_14",
            "MACD_Line", "MACD_Signal", "MACD_Hist",
            "BB_Upper", "BB_Middle", "BB_Lower", "BB_Bandwidth", "BB_PctB",
            "Daily_Return", "Log_Return", "Rolling_Vol_30d"
        ]
        available_cols = [c for c in cols_to_keep if c in export_df.columns]
        export_df = export_df[available_cols].dropna(subset=["SMA_50", "RSI_14"])

        if export_format.lower() == "json":
            return export_df.to_dict(orient="records"), "application/json"
        else:
            return export_df.to_csv(index=False), "text/csv"

    @classmethod
    def get_market_indices(cls) -> Dict[str, Any]:
        """
        Fetches real-time price & performance for major international market health benchmarks:
        - SENSEX (^BSESN) & NIFTY 50 (^NSEI) for Indian Market Health
        - NASDAQ (^IXIC) & S&P 500 (^GSPC) for US Market Health
        - FTSE 100 (^FTSE) & Nikkei 225 (^N225) for Global Markets
        """
        cache_key = "market_indices_global"
        cached = metrics_cache.get(cache_key)
        if cached:
            return cached

        indices_meta = [
            {"symbol": "^BSESN", "name": "BSE SENSEX", "region": "India 🇮🇳", "currency": "INR", "market": "Indian Market Health"},
            {"symbol": "^NSEI", "name": "NIFTY 50", "region": "India 🇮🇳", "currency": "INR", "market": "Indian National Benchmark"},
            {"symbol": "^IXIC", "name": "NASDAQ Composite", "region": "USA 🇺🇸", "currency": "USD", "market": "US Tech & Growth Health"},
            {"symbol": "^GSPC", "name": "S&P 500", "region": "USA 🇺🇸", "currency": "USD", "market": "US Broad Market Benchmark"},
            {"symbol": "^FTSE", "name": "FTSE 100", "region": "UK 🇬🇧", "currency": "GBP", "market": "London Stock Exchange"},
            {"symbol": "^N225", "name": "Nikkei 225", "region": "Japan 🇯🇵", "currency": "JPY", "market": "Tokyo Stock Exchange"}
        ]

        results = []
        for idx in indices_meta:
            sym = idx["symbol"]
            try:
                t = yf.Ticker(sym)
                hist = t.history(period="5d", interval="1d")
                if not hist.empty and len(hist) >= 1:
                    last_close = float(hist["Close"].iloc[-1])
                    prev_close = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else float(hist["Open"].iloc[-1])
                    change_amt = round(last_close - prev_close, 2)
                    change_pct = round((change_amt / prev_close) * 100, 2) if prev_close > 0 else 0.0
                else:
                    last_close, change_amt, change_pct = 75000.0, 0.0, 0.0

                health = "Bullish" if change_pct >= 0.25 else ("Bearish" if change_pct <= -0.25 else "Neutral")
                results.append({
                    "symbol": sym,
                    "name": idx["name"],
                    "region": idx["region"],
                    "market_label": idx["market"],
                    "price": round(last_close, 2),
                    "change_amount": change_amt,
                    "change_percentage": change_pct,
                    "health_status": health,
                    "currency": idx["currency"],
                    "timestamp": datetime.utcnow().isoformat()
                })
            except Exception as e:
                logger.warning(f"Failed to fetch index {sym}: {e}")
                # Fallback baseline
                fallback_prices = {"^BSESN": 80436.84, "^NSEI": 24541.15, "^IXIC": 17888.35, "^GSPC": 5554.25, "^FTSE": 8280.50, "^N225": 38062.92}
                results.append({
                    "symbol": sym,
                    "name": idx["name"],
                    "region": idx["region"],
                    "market_label": idx["market"],
                    "price": fallback_prices.get(sym, 1000.0),
                    "change_amount": 0.0,
                    "change_percentage": 0.0,
                    "health_status": "Neutral",
                    "currency": idx["currency"],
                    "timestamp": datetime.utcnow().isoformat()
                })

        output = {"indices": results, "updated_at": datetime.utcnow().isoformat()}
        metrics_cache.set(cache_key, output)
        return output

    @classmethod
    def infer_currency_from_ticker(cls, ticker: str, info_currency: Optional[str] = None) -> str:
        """Deterministically resolves native stock currency from international ticker suffix or metadata."""
        t = (ticker or "").strip().upper()
        if t.endswith(".NS") or t.endswith(".BO") or t.startswith("^BSE") or t.startswith("^NSE") or t in ("INR", "IN"):
            return "INR"
        if t.endswith(".T") or t == "^N225" or t in ("JPY", "JP"):
            return "JPY"
        if t.endswith(".L") or t == "^FTSE" or t in ("GBP", "GB"):
            return "GBP"
        if t.endswith(".DE") or t.endswith(".PA") or t.endswith(".AS") or t == "^GDAXI" or t in ("EUR", "EU"):
            return "EUR"
        if t.endswith(".HK") or t == "^HSI" or t in ("HKD", "HK"):
            return "HKD"
        if t.endswith(".TO") or t == "^GSPTSE" or t in ("CAD", "CA"):
            return "CAD"
        if t.endswith(".AX") or t == "^AXJO" or t in ("AUD", "AU"):
            return "AUD"
        if t.endswith(".SW") or t == "^SSMI" or t in ("CHF", "CH"):
            return "CHF"
        if t.endswith("-USD") or t in ("BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD", "XRP-USD"):
            return "USD"
        if info_currency:
            curr_str = str(info_currency).strip().upper()
            if curr_str in ("USD", "INR", "GBP", "EUR", "JPY", "HKD", "CAD", "AUD", "CHF"):
                return curr_str
        return "USD"

    @classmethod
    def infer_exchange_from_ticker(cls, ticker: str, info_exchange: Optional[str] = None) -> str:
        """Resolves readable international exchange name from ticker format."""
        t = (ticker or "").strip().upper()
        if t.endswith(".NS") or t.endswith(".BO") or t.startswith("^BSE") or t.startswith("^NSE"):
            return "NSE / BSE"
        if t.endswith(".T") or t == "^N225":
            return "Tokyo Stock Exchange (TSE)"
        if t.endswith(".L") or t == "^FTSE":
            return "London Stock Exchange (LSE)"
        if t.endswith(".DE") or t.endswith(".PA") or t.endswith(".AS") or t == "^GDAXI":
            return "Euronext / DAX"
        if t.endswith(".HK") or t == "^HSI":
            return "Hong Kong Stock Exchange (HKEX)"
        if t.endswith(".TO") or t == "^GSPTSE":
            return "Toronto Stock Exchange (TSX)"
        if t.endswith(".AX") or t == "^AXJO":
            return "Australian Securities Exchange (ASX)"
        if t.endswith(".SW") or t == "^SSMI":
            return "SIX Swiss Exchange"
        if t.endswith("-USD"):
            return "Crypto 24/7"
        return info_exchange or "NASDAQ/NYSE"

    @classmethod
    def _get_known_universe(cls) -> List[Dict[str, Any]]:
        """Returns internal curated universe metadata."""
        return cls.search_popular_tickers()

    @classmethod
    def get_live_price(cls, ticker: str) -> Tuple[float, str]:
        """
        Fetches live or latest market closing price and native currency for a ticker.
        Reuses cached metrics if available, or fetches reliable 1y daily bars / 5d history fallback.
        """
        clean_ticker = ticker.strip().upper()
        curr = cls.infer_currency_from_ticker(clean_ticker)

        # 1. Check if metrics are already cached for this ticker across any timeframe
        for tf in ["1y", "1d", "5d", "1m", "6m"]:
            cached = metrics_cache.get(f"metrics:{clean_ticker}:{tf}")
            if cached and hasattr(cached, "metrics") and cached.metrics.current_price:
                c = cls.infer_currency_from_ticker(clean_ticker, cached.metrics.currency)
                return cached.metrics.current_price, c

        # 2. Call full metrics calculation (with 1y daily bars for stability)
        try:
            metrics_res = cls.get_stock_metrics(clean_ticker, timeframe="1y")
            c = cls.infer_currency_from_ticker(clean_ticker, metrics_res.metrics.currency)
            return metrics_res.metrics.current_price, c
        except Exception as e:
            logger.warning(f"get_stock_metrics fallback during get_live_price({clean_ticker}): {e}")

        # 3. Direct lightweight history fallback
        try:
            stock = yf.Ticker(clean_ticker)
            hist = stock.history(period="5d", interval="1d")
            if not hist.empty:
                if isinstance(hist.columns, pd.MultiIndex):
                    hist.columns = hist.columns.get_level_values(0)
                price = round(float(hist["Close"].iloc[-1]), 2)
                return price, curr
        except Exception as e:
            logger.warning(f"Direct yf history fallback failed for {clean_ticker}: {e}")

        return 0.0, curr

    MARKET_SCHEDULES = {
        "IN": {
            "name": "India",
            "flag": "🇮🇳",
            "exchange": "NSE / BSE (National & Bombay Stock Exchange)",
            "currency": "INR",
            "symbol": "₹",
            "default_ticker": "RELIANCE.NS",
            "market_health_ticker": "^BSESN",
            "timezone_offset_minutes": 330,  # UTC+5:30
            "timezone_name": "IST (UTC+5:30)",
            "open_hour": 9,
            "open_minute": 15,
            "close_hour": 15,
            "close_minute": 30,
            "days": [0, 1, 2, 3, 4],  # Monday-Friday
        },
        "US": {
            "name": "United States",
            "flag": "🇺🇸",
            "exchange": "NASDAQ / NYSE",
            "currency": "USD",
            "symbol": "$",
            "default_ticker": "AAPL",
            "market_health_ticker": "^IXIC",
            "timezone_offset_minutes": -300,  # UTC-5:00 (EST standard/EDT)
            "timezone_name": "EST (UTC-5)",
            "open_hour": 9,
            "open_minute": 30,
            "close_hour": 16,
            "close_minute": 0,
            "days": [0, 1, 2, 3, 4],
        },
        "GB": {
            "name": "United Kingdom",
            "flag": "🇬🇧",
            "exchange": "LSE (London Stock Exchange)",
            "currency": "GBP",
            "symbol": "£",
            "default_ticker": "SHEL.L",
            "market_health_ticker": "^FTSE",
            "timezone_offset_minutes": 0,  # UTC+0:00 / BST UTC+1
            "timezone_name": "GMT (UTC+0)",
            "open_hour": 8,
            "open_minute": 0,
            "close_hour": 16,
            "close_minute": 30,
            "days": [0, 1, 2, 3, 4],
        },
        "JP": {
            "name": "Japan",
            "flag": "🇯🇵",
            "exchange": "TSE / Nikkei (Tokyo Stock Exchange)",
            "currency": "JPY",
            "symbol": "¥",
            "default_ticker": "7203.T",
            "market_health_ticker": "^N225",
            "timezone_offset_minutes": 540,  # UTC+9:00
            "timezone_name": "JST (UTC+9)",
            "open_hour": 9,
            "open_minute": 0,
            "close_hour": 15,
            "close_minute": 0,
            "days": [0, 1, 2, 3, 4],
        },
        "EU": {
            "name": "Europe",
            "flag": "🇪🇺",
            "exchange": "Euronext / DAX (Frankfurt & Paris)",
            "currency": "EUR",
            "symbol": "€",
            "default_ticker": "SAP.DE",
            "market_health_ticker": "^GDAXI",
            "timezone_offset_minutes": 60,  # UTC+1:00
            "timezone_name": "CET (UTC+1)",
            "open_hour": 9,
            "open_minute": 0,
            "close_hour": 17,
            "close_minute": 30,
            "days": [0, 1, 2, 3, 4],
        },
        "HK": {
            "name": "Hong Kong / China",
            "flag": "🇨🇳",
            "exchange": "HKEX (Hong Kong Stock Exchange)",
            "currency": "HKD",
            "symbol": "HK$",
            "default_ticker": "0700.HK",
            "market_health_ticker": "^HSI",
            "timezone_offset_minutes": 480,  # UTC+8:00
            "timezone_name": "HKT (UTC+8)",
            "open_hour": 9,
            "open_minute": 30,
            "close_hour": 16,
            "close_minute": 0,
            "days": [0, 1, 2, 3, 4],
        },
        "CA": {
            "name": "Canada",
            "flag": "🇨🇦",
            "exchange": "TSX (Toronto Stock Exchange)",
            "currency": "CAD",
            "symbol": "CA$",
            "default_ticker": "RY.TO",
            "market_health_ticker": "^GSPTSE",
            "timezone_offset_minutes": -300,  # UTC-5:00
            "timezone_name": "EST (UTC-5)",
            "open_hour": 9,
            "open_minute": 30,
            "close_hour": 16,
            "close_minute": 0,
            "days": [0, 1, 2, 3, 4],
        },
        "AU": {
            "name": "Australia",
            "flag": "🇦🇺",
            "exchange": "ASX (Australian Securities Exchange)",
            "currency": "AUD",
            "symbol": "A$",
            "default_ticker": "BHP.AX",
            "market_health_ticker": "^AXJO",
            "timezone_offset_minutes": 600,  # UTC+10:00
            "timezone_name": "AEST (UTC+10)",
            "open_hour": 10,
            "open_minute": 0,
            "close_hour": 16,
            "close_minute": 0,
            "days": [0, 1, 2, 3, 4],
        },
        "CH": {
            "name": "Switzerland",
            "flag": "🇨🇭",
            "exchange": "SIX Swiss Exchange (Zurich)",
            "currency": "CHF",
            "symbol": "CHF ",
            "default_ticker": "NESN.SW",
            "market_health_ticker": "^SSMI",
            "timezone_offset_minutes": 60,  # UTC+1:00
            "timezone_name": "CET (UTC+1)",
            "open_hour": 9,
            "open_minute": 0,
            "close_hour": 17,
            "close_minute": 30,
            "days": [0, 1, 2, 3, 4],
        },
        "GLOBAL": {
            "name": "Global Crypto",
            "flag": "🌐",
            "exchange": "24/7 Digital Asset Markets",
            "currency": "USD",
            "symbol": "$",
            "default_ticker": "BTC-USD",
            "market_health_ticker": "BTC-USD",
            "timezone_offset_minutes": 0,
            "timezone_name": "UTC 24/7",
            "open_hour": 0,
            "open_minute": 0,
            "close_hour": 23,
            "close_minute": 59,
            "days": [0, 1, 2, 3, 4, 5, 6],
        }
    }

    @classmethod
    def get_market_status(cls, country_code: str = "IN") -> Dict[str, Any]:
        """Calculates live open/closed/pre-market status, local time, and countdowns for any international exchange."""
        c = (country_code or "IN").strip().upper()
        sched = cls.MARKET_SCHEDULES.get(c, cls.MARKET_SCHEDULES["IN"])

        from datetime import datetime, timezone, timedelta
        utc_now = datetime.now(timezone.utc)
        offset_mins = sched["timezone_offset_minutes"]
        local_now = utc_now + timedelta(minutes=offset_mins)

        if c == "GLOBAL":
            return {
                "code": c,
                "name": sched["name"],
                "exchange_name": sched["exchange"],
                "country_code": c,
                "currency": sched["currency"],
                "currency_symbol": sched["symbol"],
                "is_open": True,
                "status_label": "OPEN",
                "status_color": "green",
                "local_time": local_now.strftime("%H:%M:%S %Z"),
                "timezone_name": sched["timezone_name"],
                "trading_hours": "24 Hours / 7 Days",
                "next_event": "Continuous Trading",
                "next_event_time": "Always Active"
            }

        weekday = local_now.weekday()  # 0=Monday, 6=Sunday
        cur_min_of_day = local_now.hour * 60 + local_now.minute
        open_min_of_day = sched["open_hour"] * 60 + sched["open_minute"]
        close_min_of_day = sched["close_hour"] * 60 + sched["close_minute"]

        is_trading_day = weekday in sched["days"]
        is_open = is_trading_day and (open_min_of_day <= cur_min_of_day < close_min_of_day)

        if is_open:
            status_label = "OPEN"
            status_color = "green"
            mins_left = close_min_of_day - cur_min_of_day
            hrs_left = mins_left // 60
            rem_mins = mins_left % 60
            next_event = f"Closes in {hrs_left}h {rem_mins}m"
            next_event_time = f"{sched['close_hour']:02d}:{sched['close_minute']:02d} {sched['timezone_name']}"
        elif is_trading_day and (open_min_of_day - 60 <= cur_min_of_day < open_min_of_day):
            status_label = "PRE-MARKET"
            status_color = "yellow"
            mins_to_open = open_min_of_day - cur_min_of_day
            next_event = f"Opens in {mins_to_open}m"
            next_event_time = f"{sched['open_hour']:02d}:{sched['open_minute']:02d} {sched['timezone_name']}"
        else:
            status_label = "CLOSED"
            status_color = "red"
            next_event = "Opens next session at " + f"{sched['open_hour']:02d}:{sched['open_minute']:02d}"
            next_event_time = f"{sched['open_hour']:02d}:{sched['open_minute']:02d} {sched['timezone_name']}"

        return {
            "code": c,
            "name": sched["name"],
            "exchange_name": sched["exchange"],
            "country_code": c,
            "currency": sched["currency"],
            "currency_symbol": sched["symbol"],
            "is_open": is_open,
            "status_label": status_label,
            "status_color": status_color,
            "local_time": local_now.strftime("%I:%M:%S %p"),
            "timezone_name": sched["timezone_name"],
            "trading_hours": f"{sched['open_hour']:02d}:{sched['open_minute']:02d} - {sched['close_hour']:02d}:{sched['close_minute']:02d} {sched['timezone_name']}",
            "next_event": next_event,
            "next_event_time": next_event_time
        }

    @classmethod
    def get_all_market_profiles(cls) -> List[Dict[str, Any]]:
        """Returns all international market profiles with live status and registered companies."""
        profiles = []
        for code, sched in cls.MARKET_SCHEDULES.items():
            status = cls.get_market_status(code)
            tickers = cls.search_popular_tickers(country=code)
            profiles.append({
                "code": code,
                "name": sched["name"],
                "flag": sched["flag"],
                "exchange": sched["exchange"],
                "currency": sched["currency"],
                "symbol": sched["symbol"],
                "default_ticker": sched["default_ticker"],
                "market_health_ticker": sched["market_health_ticker"],
                "status": status,
                "popular_tickers": tickers
            })
        return profiles

    @staticmethod
    def search_popular_tickers(query: Optional[str] = None, country: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Returns liquid universe categorized by country/region or searches symbols & company names.
        Supports India (BSE/NSE), USA (NASDAQ/NYSE), Japan (TSE/Nikkei), UK (LSE), Europe (DAX/Euronext), and Global Crypto.
        """
        universe = [
            # India (NSE / BSE)
            {"ticker": "RELIANCE.NS", "name": "Reliance Industries Ltd.", "sector": "Energy / Conglomerate", "country": "IN", "currency": "INR"},
            {"ticker": "TCS.NS", "name": "Tata Consultancy Services", "sector": "Information Technology", "country": "IN", "currency": "INR"},
            {"ticker": "HDFCBANK.NS", "name": "HDFC Bank Ltd.", "sector": "Financial Services", "country": "IN", "currency": "INR"},
            {"ticker": "INFY.NS", "name": "Infosys Ltd.", "sector": "Information Technology", "country": "IN", "currency": "INR"},
            {"ticker": "TATAMOTORS.NS", "name": "Tata Motors Ltd.", "sector": "Automotive", "country": "IN", "currency": "INR"},
            {"ticker": "ICICIBANK.NS", "name": "ICICI Bank Ltd.", "sector": "Financial Services", "country": "IN", "currency": "INR"},
            {"ticker": "SBIN.NS", "name": "State Bank of India", "sector": "Banking", "country": "IN", "currency": "INR"},
            {"ticker": "BHARTIARTL.NS", "name": "Bharti Airtel Ltd.", "sector": "Telecommunications", "country": "IN", "currency": "INR"},
            {"ticker": "ITC.NS", "name": "ITC Ltd.", "sector": "Consumer Goods", "country": "IN", "currency": "INR"},
            {"ticker": "WIPRO.NS", "name": "Wipro Ltd.", "sector": "Information Technology", "country": "IN", "currency": "INR"},
            {"ticker": "LT.NS", "name": "Larsen & Toubro Ltd.", "sector": "Infrastructure / Eng.", "country": "IN", "currency": "INR"},
            {"ticker": "ZOMATO.NS", "name": "Zomato Ltd.", "sector": "Consumer Internet", "country": "IN", "currency": "INR"},
            {"ticker": "ADANIENT.NS", "name": "Adani Enterprises Ltd.", "sector": "Conglomerate", "country": "IN", "currency": "INR"},
            {"ticker": "^BSESN", "name": "BSE SENSEX Index", "sector": "India Market Health", "country": "IN", "currency": "INR"},
            {"ticker": "^NSEI", "name": "NIFTY 50 Index", "sector": "India Index Benchmark", "country": "IN", "currency": "INR"},

            # Japan (TSE / Tokyo Stock Exchange & Nikkei)
            {"ticker": "7203.T", "name": "Toyota Motor Corp", "sector": "Automotive / Mobility", "country": "JP", "currency": "JPY"},
            {"ticker": "6758.T", "name": "Sony Group Corp", "sector": "Technology / Entertainment", "country": "JP", "currency": "JPY"},
            {"ticker": "9984.T", "name": "SoftBank Group Corp", "sector": "Tech Investment / AI", "country": "JP", "currency": "JPY"},
            {"ticker": "7974.T", "name": "Nintendo Co., Ltd.", "sector": "Gaming / IP", "country": "JP", "currency": "JPY"},
            {"ticker": "8058.T", "name": "Mitsubishi Corp", "sector": "Trading / Conglomerate", "country": "JP", "currency": "JPY"},
            {"ticker": "6861.T", "name": "Keyence Corp", "sector": "Sensors / Automation", "country": "JP", "currency": "JPY"},
            {"ticker": "8035.T", "name": "Tokyo Electron Ltd.", "sector": "Semiconductor Equipment", "country": "JP", "currency": "JPY"},
            {"ticker": "7267.T", "name": "Honda Motor Co., Ltd.", "sector": "Automotive", "country": "JP", "currency": "JPY"},
            {"ticker": "9983.T", "name": "Fast Retailing (Uniqlo)", "sector": "Apparel / Retail", "country": "JP", "currency": "JPY"},
            {"ticker": "4063.T", "name": "Shin-Etsu Chemical Co.", "sector": "Silicon / Materials", "country": "JP", "currency": "JPY"},
            {"ticker": "^N225", "name": "Nikkei 225 Index", "sector": "Japan Benchmark Index", "country": "JP", "currency": "JPY"},

            # United Kingdom (London Stock Exchange / LSE)
            {"ticker": "SHEL.L", "name": "Shell plc", "sector": "Energy / Oil & Gas", "country": "GB", "currency": "GBP"},
            {"ticker": "AZN.L", "name": "AstraZeneca PLC", "sector": "Healthcare / Biopharma", "country": "GB", "currency": "GBP"},
            {"ticker": "HSBC.L", "name": "HSBC Holdings plc", "sector": "Global Banking", "country": "GB", "currency": "GBP"},
            {"ticker": "ULVR.L", "name": "Unilever PLC", "sector": "Consumer Staples", "country": "GB", "currency": "GBP"},
            {"ticker": "BP.L", "name": "BP plc", "sector": "Energy / Renewables", "country": "GB", "currency": "GBP"},
            {"ticker": "GSK.L", "name": "GSK plc (GlaxoSmithKline)", "sector": "Pharmaceuticals", "country": "GB", "currency": "GBP"},
            {"ticker": "RR.L", "name": "Rolls-Royce Holdings", "sector": "Aerospace & Defense", "country": "GB", "currency": "GBP"},
            {"ticker": "RIO.L", "name": "Rio Tinto plc", "sector": "Mining / Metals", "country": "GB", "currency": "GBP"},
            {"ticker": "BARC.L", "name": "Barclays PLC", "sector": "Financial Services", "country": "GB", "currency": "GBP"},
            {"ticker": "^FTSE", "name": "FTSE 100 Index", "sector": "UK Benchmark Index", "country": "GB", "currency": "GBP"},

            # United States (NASDAQ & NYSE)
            {"ticker": "AAPL", "name": "Apple Inc.", "sector": "Technology / Consumer Tech", "country": "US", "currency": "USD"},
            {"ticker": "NVDA", "name": "NVIDIA Corporation", "sector": "Semiconductors / AI", "country": "US", "currency": "USD"},
            {"ticker": "MSFT", "name": "Microsoft Corporation", "sector": "Technology / Cloud", "country": "US", "currency": "USD"},
            {"ticker": "TSLA", "name": "Tesla, Inc.", "sector": "EV / Clean Tech", "country": "US", "currency": "USD"},
            {"ticker": "AMZN", "name": "Amazon.com, Inc.", "sector": "E-Commerce / Cloud", "country": "US", "currency": "USD"},
            {"ticker": "GOOGL", "name": "Alphabet Inc. (Google)", "sector": "Internet / Search", "country": "US", "currency": "USD"},
            {"ticker": "META", "name": "Meta Platforms, Inc. (Facebook)", "sector": "Social Media / AI", "country": "US", "currency": "USD"},
            {"ticker": "AMD", "name": "Advanced Micro Devices", "sector": "Semiconductors", "country": "US", "currency": "USD"},
            {"ticker": "NFLX", "name": "Netflix Inc.", "sector": "Streaming Entertainment", "country": "US", "currency": "USD"},
            {"ticker": "PLTR", "name": "Palantir Technologies", "sector": "Enterprise AI / Software", "country": "US", "currency": "USD"},
            {"ticker": "SPY", "name": "SPDR S&P 500 ETF Trust", "sector": "Index ETF", "country": "US", "currency": "USD"},
            {"ticker": "QQQ", "name": "Invesco QQQ Trust (NASDAQ-100)", "sector": "Tech Index ETF", "country": "US", "currency": "USD"},
            {"ticker": "^IXIC", "name": "NASDAQ Composite Index", "sector": "US Tech Market Health", "country": "US", "currency": "USD"},

            # Europe (Euronext / DAX)
            {"ticker": "SAP.DE", "name": "SAP SE", "sector": "Enterprise Software", "country": "EU", "currency": "EUR"},
            {"ticker": "SIE.DE", "name": "Siemens AG", "sector": "Industrial Engineering", "country": "EU", "currency": "EUR"},
            {"ticker": "ASML.AS", "name": "ASML Holding N.V.", "sector": "Lithography / Chips", "country": "EU", "currency": "EUR"},
            {"ticker": "MC.PA", "name": "LVMH Moët Hennessy", "sector": "Luxury Goods", "country": "EU", "currency": "EUR"},
            {"ticker": "TTE.PA", "name": "TotalEnergies SE", "sector": "Energy & Power", "country": "EU", "currency": "EUR"},
            {"ticker": "^GDAXI", "name": "DAX 40 Index", "sector": "German Benchmark Index", "country": "EU", "currency": "EUR"},

            # Hong Kong / China (HKEX)
            {"ticker": "0700.HK", "name": "Tencent Holdings Ltd.", "sector": "Internet / Gaming / AI", "country": "HK", "currency": "HKD"},
            {"ticker": "9988.HK", "name": "Alibaba Group Holding", "sector": "E-Commerce / Cloud", "country": "HK", "currency": "HKD"},
            {"ticker": "3690.HK", "name": "Meituan", "sector": "Consumer Internet / Delivery", "country": "HK", "currency": "HKD"},
            {"ticker": "1810.HK", "name": "Xiaomi Corporation", "sector": "Consumer Electronics / EV", "country": "HK", "currency": "HKD"},
            {"ticker": "1211.HK", "name": "BYD Company Limited", "sector": "Electric Vehicles / Batteries", "country": "HK", "currency": "HKD"},
            {"ticker": "0941.HK", "name": "China Mobile Ltd.", "sector": "Telecommunications", "country": "HK", "currency": "HKD"},
            {"ticker": "^HSI", "name": "Hang Seng Index", "sector": "Hong Kong Benchmark Index", "country": "HK", "currency": "HKD"},

            # Canada (Toronto Stock Exchange / TSX)
            {"ticker": "RY.TO", "name": "Royal Bank of Canada", "sector": "Financial Services / Banking", "country": "CA", "currency": "CAD"},
            {"ticker": "TD.TO", "name": "Toronto-Dominion Bank", "sector": "Banking", "country": "CA", "currency": "CAD"},
            {"ticker": "SHOP.TO", "name": "Shopify Inc.", "sector": "E-Commerce Software", "country": "CA", "currency": "CAD"},
            {"ticker": "ENB.TO", "name": "Enbridge Inc.", "sector": "Energy Infrastructure", "country": "CA", "currency": "CAD"},
            {"ticker": "CNR.TO", "name": "Canadian National Railway", "sector": "Transportation", "country": "CA", "currency": "CAD"},
            {"ticker": "^GSPTSE", "name": "S&P/TSX Composite Index", "sector": "Canada Benchmark Index", "country": "CA", "currency": "CAD"},

            # Australia (ASX)
            {"ticker": "BHP.AX", "name": "BHP Group Limited", "sector": "Mining / Natural Resources", "country": "AU", "currency": "AUD"},
            {"ticker": "CBA.AX", "name": "Commonwealth Bank of Australia", "sector": "Banking / Finance", "country": "AU", "currency": "AUD"},
            {"ticker": "CSL.AX", "name": "CSL Limited", "sector": "Biotechnology / Vaccines", "country": "AU", "currency": "AUD"},
            {"ticker": "NAB.AX", "name": "National Australia Bank", "sector": "Financial Services", "country": "AU", "currency": "AUD"},
            {"ticker": "WES.AX", "name": "Wesfarmers Limited", "sector": "Retail / Conglomerate", "country": "AU", "currency": "AUD"},
            {"ticker": "^AXJO", "name": "S&P/ASX 200 Index", "sector": "Australia Benchmark Index", "country": "AU", "currency": "AUD"},

            # Switzerland (SIX Swiss Exchange)
            {"ticker": "NESN.SW", "name": "Nestlé S.A.", "sector": "Consumer Staples / Nutrition", "country": "CH", "currency": "CHF"},
            {"ticker": "NOVN.SW", "name": "Novartis AG", "sector": "Pharmaceuticals / Healthcare", "country": "CH", "currency": "CHF"},
            {"ticker": "ROG.SW", "name": "Roche Holding AG", "sector": "Biotech / Diagnostics", "country": "CH", "currency": "CHF"},
            {"ticker": "UBSG.SW", "name": "UBS Group AG", "sector": "Wealth Management / Banking", "country": "CH", "currency": "CHF"},
            {"ticker": "^SSMI", "name": "Swiss Market Index (SMI)", "sector": "Switzerland Benchmark Index", "country": "CH", "currency": "CHF"},

            # Global Crypto (24/7)
            {"ticker": "BTC-USD", "name": "Bitcoin USD", "sector": "Digital Gold / Layer 1", "country": "GLOBAL", "currency": "USD"},
            {"ticker": "ETH-USD", "name": "Ethereum USD", "sector": "Smart Contracts / DeFi", "country": "GLOBAL", "currency": "USD"},
            {"ticker": "SOL-USD", "name": "Solana USD", "sector": "High Speed L1 / Web3", "country": "GLOBAL", "currency": "USD"},
            {"ticker": "BNB-USD", "name": "Binance Coin USD", "sector": "Exchange Ecosystem", "country": "GLOBAL", "currency": "USD"},
            {"ticker": "XRP-USD", "name": "XRP USD", "sector": "Cross-Border Payments", "country": "GLOBAL", "currency": "USD"},
        ]

        if query and query.strip():
            raw_q = query.strip()
            q = raw_q.upper()

            # 1. First search local curated universe (ticker, name, sector)
            matched = [
                item for item in universe
                if q in item["ticker"].upper() or q in item["name"].upper() or q in item["sector"].upper()
            ]

            # 2. If limited matches, query live Yahoo Finance search
            yf_matches: List[Dict[str, Any]] = []
            try:
                search_res = yf.Search(raw_q, max_results=8)
                if search_res and hasattr(search_res, "quotes"):
                    for item in search_res.quotes:
                        sym = str(item.get("symbol", "")).strip().upper()
                        if not sym or (sym.startswith("^") and len(sym) > 6):
                            continue
                        name = item.get("shortname") or item.get("longname") or sym
                        sector = item.get("sector") or item.get("industry") or item.get("typeDisp") or "Equity"
                        
                        # Infer currency & country
                        if sym.endswith(".NS") or sym.endswith(".BO"):
                            curr, c_code = "INR", "IN"
                        elif sym.endswith(".L"):
                            curr, c_code = "GBP", "GB"
                        elif sym.endswith(".T"):
                            curr, c_code = "JPY", "JP"
                        elif sym.endswith(".DE") or sym.endswith(".PA") or sym.endswith(".AS"):
                            curr, c_code = "EUR", "EU"
                        elif sym.endswith("-USD"):
                            curr, c_code = "USD", "GLOBAL"
                        else:
                            curr, c_code = "USD", "US"

                        yf_matches.append({
                            "ticker": sym,
                            "name": name,
                            "sector": sector,
                            "country": c_code,
                            "currency": curr
                        })
            except Exception as e:
                logger.warning(f"yf.Search fallback error for '{raw_q}': {e}")

            # Merge results preserving order and deduplicating by ticker
            combined: List[Dict[str, Any]] = []
            seen_tickers = set()
            for item in matched + yf_matches:
                t = item["ticker"].upper()
                if t not in seen_tickers:
                    seen_tickers.add(t)
                    combined.append(item)

            if not combined:
                # Dynamic ticker fallback
                currency = "INR" if (".NS" in q or ".BO" in q) else ("GBP" if ".L" in q else ("JPY" if ".T" in q else "USD"))
                country_code = country or ("IN" if ".NS" in q else ("GB" if ".L" in q else ("JP" if ".T" in q else "US")))
                combined = [{"ticker": q, "name": f"{q} Security", "sector": "Global Equity", "country": country_code, "currency": currency}]

            return combined[:14]

        if country:
            c = country.strip().upper()
            filtered = [item for item in universe if item["country"] == c]
            if filtered:
                return filtered

        return universe

