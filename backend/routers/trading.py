import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from database import get_db
from models.database_models import User
from models.schemas import (
    OrderRequest,
    OrderResponse,
    PortfolioSummary,
    TransactionItem
)
from routers.auth import get_current_user
from services.trading_engine import TradingEngine

logger = logging.getLogger("trading_router")
router = APIRouter(prefix="/api/trading", tags=["Paper Trading Engine"])

@router.get("/portfolio", response_model=PortfolioSummary)
def get_portfolio(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves current virtual cash, total portfolio equity, and open positions for the authenticated user."""
    try:
        return TradingEngine.get_portfolio_summary(db, user_id=user.id)
    except Exception as e:
        logger.error(f"Error fetching portfolio summary for user {user.username} (id: {user.id}): {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch portfolio: {str(e)}")

@router.post("/order", response_model=OrderResponse)
def execute_order(
    order: OrderRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes a simulated Buy or Sell order at real-time market price for the user.
    Validates cash balance across the unified shared wallet.
    """
    try:
        return TradingEngine.execute_order(db, order, user_id=user.id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Order execution error for {order.ticker} (user: {user.username}): {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Order execution failed: {str(e)}")

@router.get("/transactions", response_model=List[TransactionItem])
def get_transactions(
    limit: int = Query(50, ge=1, le=200, description="Max transaction records to fetch"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves past trading transactions and realized profit/loss logs for the user."""
    try:
        return TradingEngine.get_transaction_history(db, user_id=user.id, limit=limit)
    except Exception as e:
        logger.error(f"Error fetching transaction history for user {user.username}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch transactions: {str(e)}")

@router.post("/reset")
def reset_portfolio(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Resets user portfolio to starting balance and clears all holdings for the user."""
    try:
        return TradingEngine.reset_portfolio(db, user_id=user.id)
    except Exception as e:
        logger.error(f"Error resetting portfolio for user {user.username}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to reset portfolio: {str(e)}")

@router.post("/switch-currency", response_model=PortfolioSummary)
def switch_currency(
    currency: str = Query(..., description="Target currency code: USD, INR, GBP, EUR, JPY"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Converts user portfolio cash balance to target currency seamlessly."""
    try:
        TradingEngine.convert_portfolio_currency(db, target_currency=currency, user_id=user.id)
        return TradingEngine.get_portfolio_summary(db, user_id=user.id)
    except Exception as e:
        logger.error(f"Error converting portfolio currency to {currency} for user {user.username}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to switch currency: {str(e)}")
