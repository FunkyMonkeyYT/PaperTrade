import logging
from fastapi import APIRouter, HTTPException, Query, Path, Response
from typing import Optional, List
from models.schemas import StockMetricsResponse, SearchResultItem
from services.quant_engine import QuantEngine

logger = logging.getLogger("stock_router")
router = APIRouter(prefix="/api/stock", tags=["Stock Intelligence & Analytics"])

@router.get("/indices")
def get_market_indices():
    """
    Returns live benchmark indices including SENSEX (India), NASDAQ (US),
    NIFTY 50, S&P 500, FTSE 100, and Nikkei 225 with health indicators.
    """
    try:
        return QuantEngine.get_market_indices()
    except Exception as e:
        logger.error(f"Failed to fetch market indices: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch market indices.")

@router.get("/search", response_model=List[SearchResultItem])
def search_stocks(
    q: Optional[str] = Query(None, description="Search ticker symbol or company name"),
    country: Optional[str] = Query(None, description="Filter by country (e.g. IN, US, GB, JP, GLOBAL)")
):
    """Searches stock universe or returns top liquid assets by country."""
    try:
        results = QuantEngine.search_popular_tickers(q, country=country)
        return [SearchResultItem(**item) for item in results]
    except Exception as e:
        logger.error(f"Search failed for query '{q}', country '{country}': {e}")
        raise HTTPException(status_code=500, detail="Search failed. Please try again.")


@router.get("/{ticker}/metrics", response_model=StockMetricsResponse)
def get_stock_metrics(
    ticker: str = Path(..., description="Stock ticker symbol (e.g. AAPL, NVDA, TSLA)"),
    timeframe: str = Query("1y", pattern="^(1d|5d|1m|6m|1y|5y)$", description="Chart timeframe"),
    refresh: bool = Query(False, description="Force bypass cache")
):
    """
    Retrieves real-time price, fundamentals, candlestick series,
    and computes 20/50 SMA, 14-day RSI, MACD, Bollinger Bands, and Annualized Volatility.
    """
    try:
        data = QuantEngine.get_stock_metrics(ticker, timeframe=timeframe, force_refresh=refresh)
        return data
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Error fetching metrics for ticker '{ticker}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to calculate stock metrics.")

@router.get("/{ticker}/export")
def export_stock_data(
    ticker: str = Path(..., description="Stock ticker symbol"),
    timeframe: str = Query("2y", description="Data history range (e.g. 1y, 2y, 5y, max)"),
    format: str = Query("csv", pattern="^(csv|json)$", description="Export format (csv or json)")
):
    """
    Exports clean historical price series and computed technical indicators
    (SMA 20/50/200, RSI 14, MACD, Bollinger Bands, Volatility) for external machine learning models.
    """
    try:
        data, media_type = QuantEngine.export_dataset(ticker, timeframe=timeframe, export_format=format)
        clean_sym = ticker.strip().upper()
        if format == "csv":
            return Response(
                content=data,
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={clean_sym}_ml_indicators_{timeframe}.csv"}
            )
        else:
            return data
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Export failed for ticker '{ticker}': {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Export failed. Please try again.")
