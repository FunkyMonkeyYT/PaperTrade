from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class CandleStick(BaseModel):
    time: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    sma20: Optional[float] = None
    sma50: Optional[float] = None
    bb_upper: Optional[float] = None
    bb_middle: Optional[float] = None
    bb_lower: Optional[float] = None

class BollingerBandsData(BaseModel):
    upper: float
    middle: float
    lower: float
    bandwidth: float  # (Upper - Lower) / Middle
    percent_b: float  # (Price - Lower) / (Upper - Lower)
    status: str  # "Overbought (Upper Band Tag)", "Oversold (Lower Band Tag)", "Within Normal Range", "Band Squeeze"

class KeyMetrics(BaseModel):
    current_price: float
    previous_close: float
    open_price: float
    day_high: float
    day_low: float
    change_amount: float
    change_percentage: float
    volume: int
    avg_volume_10d: Optional[int] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    fifty_two_week_high: float
    fifty_two_week_low: float
    fifty_two_week_change: Optional[float] = None
    beta: Optional[float] = None
    currency: str = "USD"
    exchange: Optional[str] = None
    company_name: str
    sector: Optional[str] = None
    industry: Optional[str] = None

class IndicatorValues(BaseModel):
    sma20: float
    sma50: float
    sma200: Optional[float] = None
    rsi14: float
    rsi_status: str  # "Overbought", "Oversold", "Neutral"
    macd_line: float
    macd_signal: float
    macd_histogram: float
    macd_crossover: str  # "Bullish Crossover", "Bearish Crossover", "Neutral"
    bollinger_bands: BollingerBandsData
    volatility_30d_annualized: float
    volatility_status: str  # "Low", "Moderate", "High", "Extreme"
    support_level: float
    resistance_level: float
    sma_alignment: str

class QuantScoreCard(BaseModel):
    trend_score: float = Field(..., description="0 to 100")
    momentum_score: float = Field(..., description="0 to 100")
    volatility_score: float = Field(..., description="0 to 100")
    composite_score: float = Field(..., description="0 to 100")
    verdict: str  # "Strong Buy", "Buy", "Hold", "Underperform", "Sell"
    confidence_score: int
    algorithmic_summary: str

class StockMetricsResponse(BaseModel):
    ticker: str
    company_name: str
    timeframe: str
    metrics: KeyMetrics
    indicators: IndicatorValues
    quant_scores: QuantScoreCard
    candles: List[CandleStick]
    cached: bool = False
    timestamp: str

class OrderRequest(BaseModel):
    ticker: str
    order_type: str = Field(..., pattern="^(BUY|SELL|buy|sell)$")
    shares: float = Field(..., gt=0, description="Number of shares to trade")

class OrderResponse(BaseModel):
    transaction_id: int
    ticker: str
    order_type: str
    shares: float
    execution_price: float
    total_amount: float
    realized_pnl: float
    cash_remaining: float
    shares_remaining: float
    message: str
    timestamp: str

class PositionDetail(BaseModel):
    id: int
    ticker: str
    shares: float
    average_entry_price: float
    current_price: float
    market_value: float
    total_cost: float
    unrealized_pnl: float
    unrealized_pnl_percent: float
    allocation_percent: Optional[float] = None

class PortfolioSummary(BaseModel):
    cash_balance: float
    invested_value: float
    total_portfolio_value: float
    total_unrealized_pnl: float
    total_unrealized_pnl_percent: float
    total_realized_pnl: float
    starting_balance: float
    total_return_percent: float
    currency: str = "USD"
    positions: List[PositionDetail]
    positions_count: int


class TransactionItem(BaseModel):
    id: int
    ticker: str
    order_type: str
    shares: float
    execution_price: float
    total_value: float
    realized_pnl: float
    timestamp: str

class SearchResultItem(BaseModel):
    ticker: str
    name: str
    sector: Optional[str] = None
    country: Optional[str] = "US"
    currency: Optional[str] = "USD"
    asset_type: str = "Equity"

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Unique alphanumeric username")
    password: str = Field(..., min_length=6, description="Account password")
    email: Optional[str] = Field(None, description="Optional email address")
    avatar_url: Optional[str] = Field(None, description="Avatar image URL")
    default_country: Optional[str] = Field("IN", description="Default trading market (IN, US, GB, JP, EU, HK, CA, AU, CH, GLOBAL)")
    default_currency: Optional[str] = Field(None, description="Default currency")

class GoogleAuthRequest(BaseModel):
    google_id: str = Field(...)
    email: str = Field(...)
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    default_country: Optional[str] = "IN"

class LoginRequest(BaseModel):
    username_or_email: str = Field(..., description="Username or email address")
    password: str = Field(..., description="Account password")

class ChangePasswordRequest(BaseModel):
    old_password: str = Field(...)
    new_password: str = Field(..., min_length=6)

class EmailLoginRequest(BaseModel):
    email: str = Field(..., description="User email for persistent account session")

class OnboardingRequest(BaseModel):
    country: str = Field("IN", description="Primary trading country: IN, US, GB, JP, EU, HK, CA, AU, CH, GLOBAL")
    currency: Optional[str] = None

class AvatarUpdateRequest(BaseModel):
    avatar_url: str

class UserProfileResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    default_country: str
    default_currency: str
    is_onboarded: bool
    created_at: str

class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse

class MarketIndexItem(BaseModel):
    symbol: str
    name: str
    region: str
    price: float
    change_amount: float
    change_percentage: float
    health_status: str  # "Bullish", "Bearish", "Neutral"
    currency: str
    timestamp: str

class MarketIndicesResponse(BaseModel):
    indices: List[MarketIndexItem]
    updated_at: str

class MarketStatusInfo(BaseModel):
    code: str
    name: str
    exchange_name: str
    country_code: str
    currency: str
    currency_symbol: str
    is_open: bool
    status_label: str  # "OPEN", "CLOSED", "PRE-MARKET", "AFTER-HOURS"
    status_color: str  # "green", "red", "yellow"
    local_time: str
    timezone_name: str
    trading_hours: str
    next_event: str
    next_event_time: str

class MarketProfileItem(BaseModel):
    code: str
    name: str
    flag: str
    exchange: str
    currency: str
    symbol: str
    default_ticker: str
    market_health_ticker: str
    status: MarketStatusInfo
    popular_tickers: List[SearchResultItem]

