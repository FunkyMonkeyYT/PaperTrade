import re
from pydantic import BaseModel, Field, field_validator
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


# ---------------------------------------------------------------------------
# Input schemas with strict validation
# ---------------------------------------------------------------------------

# Reusable regex: alphanumeric + basic punctuation, no script injection
_SAFE_TEXT_RE = re.compile(r"^[a-zA-Z0-9 _.@+\-]+$")
_TICKER_RE = re.compile(r"^[A-Z0-9\.\-\^=]+$")


class OrderRequest(BaseModel):
    ticker: str = Field(..., max_length=20)
    order_type: str = Field(..., pattern="^(BUY|SELL|buy|sell)$")
    shares: float = Field(..., gt=0, le=1000000, description="Number of shares to trade")

    @field_validator("ticker")
    @classmethod
    def validate_ticker(cls, v: str) -> str:
        v = v.strip().upper()
        if not v or len(v) > 20:
            raise ValueError("Ticker must be 1-20 characters.")
        if not _TICKER_RE.match(v):
            raise ValueError("Ticker contains invalid characters.")
        return v

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
    password: str = Field(..., min_length=6, max_length=128, description="Account password")
    email: Optional[str] = Field(None, max_length=255, description="Optional email address")
    avatar_url: Optional[str] = Field(None, max_length=2048, description="Avatar image URL")
    default_country: Optional[str] = Field("IN", max_length=10, description="Default trading market")
    default_currency: Optional[str] = Field(None, max_length=10, description="Default currency")

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[a-zA-Z0-9_.\-]+$", v):
            raise ValueError("Username can only contain letters, numbers, underscores, dots, and hyphens.")
        return v

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: Optional[str]) -> Optional[str]:
        if v is None or not v.strip():
            return None
        v = v.strip().lower()
        if not re.match(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Invalid email format.")
        return v

class GoogleAuthRequest(BaseModel):
    google_id: str = Field(..., max_length=255)
    email: str = Field(..., max_length=255)
    name: Optional[str] = Field(None, max_length=100)
    avatar_url: Optional[str] = Field(None, max_length=2048)
    default_country: Optional[str] = Field("IN", max_length=10)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Invalid email format.")
        return v

class LoginRequest(BaseModel):
    username_or_email: str = Field(..., max_length=255, description="Username or email address")
    password: str = Field(..., max_length=128, description="Account password")

class ChangePasswordRequest(BaseModel):
    old_password: str = Field(..., max_length=128)
    new_password: str = Field(..., min_length=6, max_length=128)

class EmailLoginRequest(BaseModel):
    email: str = Field(..., max_length=255, description="User email for persistent account session")

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$", v):
            raise ValueError("Invalid email format.")
        return v

class OnboardingRequest(BaseModel):
    country: str = Field("IN", max_length=10, description="Primary trading country")
    currency: Optional[str] = Field(None, max_length=10)

class AvatarUpdateRequest(BaseModel):
    avatar_url: str = Field(..., max_length=2048)

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
