import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session

from models.database_models import User, Portfolio, Position, Transaction
from models.schemas import (
    OrderRequest,
    OrderResponse,
    PositionDetail,
    PortfolioSummary,
    TransactionItem
)
from services.quant_engine import QuantEngine

logger = logging.getLogger("trading_engine")
logging.basicConfig(level=logging.INFO)


class TradingEngine:
    """
    Paper Trading & Portfolio Simulation Engine.
    Handles order execution (BUY/SELL), cash validation, weighted average cost basis,
    realized/unrealized P&L tracking, multi-market FX conversion, and multi-device persistence.
    """

    # Real-world foreign exchange conversion baseline ($100,000 USD base capital)
    FX_RATES: Dict[str, float] = {
        "USD": 1.0,
        "INR": 83.5,       # $100,000 USD = ₹8,350,000 INR
        "GBP": 0.79,       # $100,000 USD = £79,000 GBP
        "EUR": 0.92,       # $100,000 USD = €92,000 EUR
        "JPY": 155.0,      # $100,000 USD = ¥15,500,000 JPY
        "HKD": 7.82,       # $100,000 USD = HK$782,000 HKD
        "CAD": 1.36,       # $100,000 USD = CA$136,000 CAD
        "AUD": 1.52,       # $100,000 USD = A$152,000 AUD
        "CHF": 0.90,       # $100,000 USD = CHF 90,000 CHF
    }

    @classmethod
    def get_fx_rate(cls, from_currency: str, to_currency: str) -> float:
        """Calculates exact exchange rate between any two currencies."""
        from_curr = (from_currency or "USD").strip().upper()
        to_curr = (to_currency or "USD").strip().upper()
        if from_curr == to_curr:
            return 1.0
        from_rate = cls.FX_RATES.get(from_curr, 1.0)
        to_rate = cls.FX_RATES.get(to_curr, 1.0)
        return to_rate / from_rate

    @classmethod
    def find_user(cls, db: Session, identifier: str) -> Optional[User]:
        """Finds user by username (case-insensitive) or email."""
        clean = identifier.strip().lower()
        return db.query(User).filter(
            (User.username.ilike(clean)) | (User.email.ilike(clean))
        ).first()

    @classmethod
    def create_user_with_credentials(
        cls,
        db: Session,
        username: str,
        password: str,
        email: Optional[str] = None,
        avatar_url: Optional[str] = None,
        default_country: str = "IN",
        default_currency: Optional[str] = None
    ) -> User:
        """Creates a new user account with hashed password and initialized $100k starting capital."""
        from utils.security import hash_password

        clean_username = username.strip()
        if len(clean_username) < 3:
            raise HTTPException(status_code=400, detail="Username must be at least 3 characters long.")

        existing = db.query(User).filter(User.username.ilike(clean_username)).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Username '{clean_username}' is already taken.")

        clean_email = email.strip().lower() if email and email.strip() else None
        if clean_email:
            existing_email = db.query(User).filter(User.email.ilike(clean_email)).first()
            if existing_email:
                raise HTTPException(status_code=400, detail=f"Email '{clean_email}' is already registered.")

        country = (default_country or "IN").strip().upper()
        curr_map = {
            "IN": "INR", "US": "USD", "GB": "GBP", "JP": "JPY", "EU": "EUR",
            "HK": "HKD", "CA": "CAD", "AUD": "AUD", "AU": "AUD", "CH": "CHF", "GLOBAL": "USD"
        }
        curr = default_currency or curr_map.get(country, "INR")

        pwd_hash = hash_password(password)
        user = User(
            username=clean_username,
            email=clean_email,
            password_hash=pwd_hash,
            avatar_url=avatar_url,
            default_country=country,
            default_currency=curr,
            is_onboarded=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Initialize shared portfolio
        cls.get_or_create_portfolio(db, user_id=user.id)
        return user

    @classmethod
    def get_or_create_google_user(
        cls,
        db: Session,
        google_id: str,
        email: str,
        name: str,
        avatar_url: Optional[str] = None,
        default_country: str = "IN"
    ) -> User:
        """Finds or creates a verified user profile via Google Sign-In."""
        clean_email = email.strip().lower()
        user = db.query(User).filter(User.email.ilike(clean_email)).first()

        if user:
            if avatar_url and not user.avatar_url:
                user.avatar_url = avatar_url
                user.updated_at = datetime.utcnow()
                db.commit()
                db.refresh(user)
            return user

        # Create unique username from Google Name or Email
        base_username = "".join(c for c in (name or "") if c.isalnum()) or clean_email.split("@")[0]
        if len(base_username) < 3:
            base_username = "trader_" + base_username
        
        candidate = base_username
        counter = 1
        while db.query(User).filter(User.username.ilike(candidate)).first():
            candidate = f"{base_username}_{counter}"
            counter += 1

        country = (default_country or "IN").strip().upper()
        curr_map = {
            "IN": "INR", "US": "USD", "GB": "GBP", "JP": "JPY", "EU": "EUR",
            "HK": "HKD", "CA": "CAD", "AUD": "AUD", "AU": "AUD", "CH": "CHF", "GLOBAL": "USD"
        }
        curr = curr_map.get(country, "INR")

        user = User(
            username=candidate,
            email=clean_email,
            password_hash=None,
            avatar_url=avatar_url,
            default_country=country,
            default_currency=curr,
            is_onboarded=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Initialize shared portfolio
        cls.get_or_create_portfolio(db, user_id=user.id)
        return user

    @classmethod
    def authenticate_user(cls, db: Session, username_or_email: str, password: str) -> Optional[User]:
        """Authenticates user with username or email and password."""
        from utils.security import verify_password
        user = cls.find_user(db, username_or_email)
        if not user or not user.password_hash:
            return None
        if verify_password(password, user.password_hash):
            return user
        return None

    @classmethod
    def get_or_create_user(
        cls,
        db: Session,
        email: Optional[str] = None,
        username: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> User:
        """Retrieves or creates user record for multi-device sync."""
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                return user

        if username and username.strip():
            user = db.query(User).filter(User.username.ilike(username.strip())).first()
            if user:
                return user

        if email and email.strip():
            clean_email = email.strip().lower()
            user = db.query(User).filter(User.email == clean_email).first()
            if not user:
                base_username = clean_email.split("@")[0][:25]
                uname = base_username
                count = 1
                while db.query(User).filter(User.username == uname).first():
                    uname = f"{base_username}_{count}"
                    count += 1

                user = User(
                    username=uname,
                    email=clean_email,
                    default_country="IN" if clean_email.endswith(".in") else "US",
                    default_currency="INR" if clean_email.endswith(".in") else "USD",
                    is_onboarded=False
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            return user

        # Default fallback user
        user = db.query(User).first()
        if not user:
            user = User(id=1, username="trader", email="trader@papertrade.local", is_onboarded=True)
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    @classmethod
    def get_or_create_portfolio(
        cls,
        db: Session,
        email: Optional[str] = None,
        username: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Portfolio:
        """Retrieves user portfolio or initializes one with default $100k USD equivalent starting cash."""
        user = cls.get_or_create_user(db, email=email, username=username, user_id=user_id)
        portfolio = db.query(Portfolio).filter(Portfolio.user_id == user.id).first()
        curr = user.default_currency or "USD"
        rate = cls.FX_RATES.get(curr, 1.0)
        default_starting = round(100000.0 * rate, 2)

        if not portfolio:
            portfolio = Portfolio(
                user_id=user.id,
                cash_balance=default_starting,
                starting_balance=default_starting,
                currency=curr,
                total_realized_pnl=0.0
            )
            db.add(portfolio)
            db.commit()
            db.refresh(portfolio)
        else:
            # Heal legacy 1M INR bug if detected
            if portfolio.currency == "INR" and portfolio.starting_balance == 1000000.0:
                portfolio.starting_balance = 8350000.0
                if portfolio.cash_balance == 1000000.0:
                    portfolio.cash_balance = 8350000.0
                db.commit()
                db.refresh(portfolio)

        return portfolio

    @classmethod
    def convert_portfolio_currency(cls, db: Session, target_currency: str, email: Optional[str] = None, user_id: Optional[int] = None) -> Portfolio:
        """Seamlessly converts user cash balance, starting balance, and position cost basis when changing country."""
        portfolio = cls.get_or_create_portfolio(db, email=email, user_id=user_id)
        old_currency = portfolio.currency or "USD"
        target_currency = target_currency.strip().upper()

        if old_currency != target_currency:
            factor = cls.get_fx_rate(old_currency, target_currency)

            portfolio.cash_balance = round(portfolio.cash_balance * factor, 2)
            portfolio.starting_balance = round(portfolio.starting_balance * factor, 2)
            portfolio.total_realized_pnl = round(portfolio.total_realized_pnl * factor, 2)
            portfolio.currency = target_currency
            portfolio.updated_at = datetime.utcnow()

            # Also scale position average entry prices to match new currency
            positions = db.query(Position).filter(Position.portfolio_id == portfolio.id).all()
            for pos in positions:
                pos.average_entry_price = round(pos.average_entry_price * factor, 4)
                pos.updated_at = datetime.utcnow()

            user = cls.get_or_create_user(db, email=email, user_id=user_id)
            user.default_currency = target_currency
            db.commit()
            db.refresh(portfolio)

        return portfolio

    @classmethod
    def execute_order(cls, db: Session, order: OrderRequest, email: Optional[str] = None, user_id: Optional[int] = None) -> OrderResponse:
        """
        Executes simulated Buy or Sell order at real-time market price converted to user's active portfolio currency.
        Validates cash/shares and updates position and ledger atomically.
        """
        clean_ticker = order.ticker.strip().upper()
        order_action = order.order_type.strip().upper()
        shares = round(float(order.shares), 4)

        if shares <= 0:
            raise HTTPException(status_code=400, detail="Trade quantity must be greater than 0.")

        # Fetch current execution price via QuantEngine
        try:
            metrics_res = QuantEngine.get_stock_metrics(clean_ticker, timeframe="1d")
            native_price = metrics_res.metrics.current_price
            stock_currency = metrics_res.metrics.currency or "USD"
        except Exception as e:
            logger.error(f"Failed to fetch market price for {clean_ticker}: {e}")
            raise HTTPException(status_code=400, detail=f"Cannot execute order: Market data unavailable for '{clean_ticker}'.")

        portfolio = cls.get_or_create_portfolio(db, email=email, user_id=user_id)
        portfolio_currency = portfolio.currency or "USD"

        # Dynamically convert stock price to user's active portfolio currency
        fx_multiplier = cls.get_fx_rate(stock_currency, portfolio_currency)
        execution_price = round(native_price * fx_multiplier, 2)

        position = db.query(Position).filter(
            Position.portfolio_id == portfolio.id,
            Position.ticker == clean_ticker
        ).first()

        total_value = round(shares * execution_price, 2)
        realized_pnl = 0.0

        if order_action == "BUY":
            if portfolio.cash_balance < total_value:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient funds. Required: {portfolio.currency} {total_value:,.2f}, Available: {portfolio.currency} {portfolio.cash_balance:,.2f}"
                )

            # Deduct cash
            portfolio.cash_balance = round(portfolio.cash_balance - total_value, 2)

            if position:
                # Calculate weighted average entry price
                current_total_cost = position.shares * position.average_entry_price
                new_total_cost = current_total_cost + total_value
                new_shares = position.shares + shares
                position.average_entry_price = round(new_total_cost / new_shares, 4)
                position.shares = round(new_shares, 4)
                position.updated_at = datetime.utcnow()
                shares_remaining = position.shares
            else:
                position = Position(
                    portfolio_id=portfolio.id,
                    ticker=clean_ticker,
                    shares=shares,
                    average_entry_price=round(execution_price, 4)
                )
                db.add(position)
                shares_remaining = shares

            message = f"Successfully bought {shares:g} shares of {clean_ticker} at {portfolio.currency} {execution_price:,.2f}."

        elif order_action == "SELL":
            if not position or position.shares < shares:
                available_shares = position.shares if position else 0.0
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient shares to sell. Requested: {shares:g}, Available: {available_shares:g}."
                )

            # Calculate realized P&L
            cost_basis = shares * position.average_entry_price
            realized_pnl = round(total_value - cost_basis, 2)

            # Add cash & update realized P&L
            portfolio.cash_balance = round(portfolio.cash_balance + total_value, 2)
            portfolio.total_realized_pnl = round(portfolio.total_realized_pnl + realized_pnl, 2)

            new_shares = round(position.shares - shares, 4)
            if new_shares <= 0.0001:
                db.delete(position)
                shares_remaining = 0.0
            else:
                position.shares = new_shares
                position.updated_at = datetime.utcnow()
                shares_remaining = new_shares

            message = (
                f"Successfully sold {shares:g} shares of {clean_ticker} at {portfolio.currency} {execution_price:,.2f}. "
                f"Realized P&L: {'+' if realized_pnl >= 0 else ''}{portfolio.currency} {realized_pnl:,.2f}."
            )

        else:
            raise HTTPException(status_code=400, detail=f"Invalid order type '{order_action}'. Must be BUY or SELL.")

        # Record Transaction
        tx = Transaction(
            portfolio_id=portfolio.id,
            ticker=clean_ticker,
            order_type=order_action,
            shares=shares,
            execution_price=execution_price,
            total_value=total_value,
            realized_pnl=realized_pnl,
            timestamp=datetime.utcnow()
        )
        db.add(tx)
        db.commit()
        db.refresh(tx)

        return OrderResponse(
            transaction_id=tx.id,
            ticker=clean_ticker,
            order_type=order_action,
            shares=shares,
            execution_price=execution_price,
            total_amount=total_value,
            realized_pnl=realized_pnl,
            cash_remaining=portfolio.cash_balance,
            shares_remaining=shares_remaining,
            message=message,
            timestamp=tx.timestamp.isoformat()
        )

    @classmethod
    def get_portfolio_summary(cls, db: Session, email: Optional[str] = None, user_id: Optional[int] = None) -> PortfolioSummary:
        """
        Calculates live portfolio valuation, invested equity, and position-level P&L
        harmonized into user's active portfolio currency.
        """
        portfolio = cls.get_or_create_portfolio(db, email=email, user_id=user_id)
        positions = db.query(Position).filter(Position.portfolio_id == portfolio.id).all()
        portfolio_curr = portfolio.currency or "USD"

        position_details: List[PositionDetail] = []
        total_market_value = 0.0
        total_unrealized_pnl = 0.0

        for pos in positions:
            if pos.shares <= 0:
                continue

            try:
                metrics_res = QuantEngine.get_stock_metrics(pos.ticker, timeframe="1d")
                native_price = metrics_res.metrics.current_price
                stock_curr = metrics_res.metrics.currency or "USD"
                fx_factor = cls.get_fx_rate(stock_curr, portfolio_curr)
                current_price = round(native_price * fx_factor, 2)
            except Exception:
                current_price = pos.average_entry_price

            mkt_val = round(pos.shares * current_price, 2)
            cost = round(pos.shares * pos.average_entry_price, 2)
            pos_unrealized_pnl = round(mkt_val - cost, 2)
            pos_unrealized_pct = round((pos_unrealized_pnl / cost * 100) if cost > 0 else 0.0, 2)

            total_market_value += mkt_val
            total_unrealized_pnl += pos_unrealized_pnl

            position_details.append(PositionDetail(
                id=pos.id,
                ticker=pos.ticker,
                shares=pos.shares,
                average_entry_price=pos.average_entry_price,
                current_price=current_price,
                market_value=mkt_val,
                total_cost=cost,
                unrealized_pnl=pos_unrealized_pnl,
                unrealized_pnl_percent=pos_unrealized_pct
            ))

        total_portfolio_value = round(portfolio.cash_balance + total_market_value, 2)

        # Calculate allocations
        for pd_item in position_details:
            if total_portfolio_value > 0:
                pd_item.allocation_percent = round((pd_item.market_value / total_portfolio_value) * 100, 1)

        total_cost_basis = sum(p.total_cost for p in position_details)
        total_unrealized_pnl_percent = round((total_unrealized_pnl / total_cost_basis * 100) if total_cost_basis > 0 else 0.0, 2)
        total_return_percent = round(((total_portfolio_value - portfolio.starting_balance) / portfolio.starting_balance) * 100, 2)

        return PortfolioSummary(
            cash_balance=portfolio.cash_balance,
            invested_value=round(total_market_value, 2),
            total_portfolio_value=total_portfolio_value,
            total_unrealized_pnl=round(total_unrealized_pnl, 2),
            total_unrealized_pnl_percent=total_unrealized_pnl_percent,
            total_realized_pnl=round(portfolio.total_realized_pnl, 2),
            starting_balance=portfolio.starting_balance,
            total_return_percent=total_return_percent,
            currency=portfolio.currency or "USD",
            positions=position_details,
            positions_count=len(position_details)
        )

    @classmethod
    def get_transaction_history(cls, db: Session, email: Optional[str] = None, user_id: Optional[int] = None, limit: int = 100) -> List[TransactionItem]:
        """Retrieves recent trading transactions."""
        portfolio = cls.get_or_create_portfolio(db, email=email, user_id=user_id)
        txs = db.query(Transaction).filter(
            Transaction.portfolio_id == portfolio.id
        ).order_by(Transaction.timestamp.desc()).limit(limit).all()

        return [
            TransactionItem(
                id=t.id,
                ticker=t.ticker,
                order_type=t.order_type,
                shares=t.shares,
                execution_price=t.execution_price,
                total_value=t.total_value,
                realized_pnl=t.realized_pnl,
                timestamp=t.timestamp.isoformat()
            )
            for t in txs
        ]

    @classmethod
    def reset_portfolio(cls, db: Session, email: Optional[str] = None, user_id: Optional[int] = None) -> Dict[str, Any]:
        """Resets portfolio cash balance to starting balance and clears all positions & transactions."""
        portfolio = cls.get_or_create_portfolio(db, email=email, user_id=user_id)

        db.query(Position).filter(Position.portfolio_id == portfolio.id).delete()
        db.query(Transaction).filter(Transaction.portfolio_id == portfolio.id).delete()

        rate = cls.FX_RATES.get(portfolio.currency or "USD", 1.0)
        fresh_starting = round(100000.0 * rate, 2)
        portfolio.starting_balance = fresh_starting
        portfolio.cash_balance = fresh_starting
        portfolio.total_realized_pnl = 0.0
        portfolio.updated_at = datetime.utcnow()
        db.commit()

        return {
            "message": f"Portfolio reset successfully to {portfolio.currency} {portfolio.starting_balance:,.2f} starting cash.",
            "cash_balance": portfolio.cash_balance,
            "positions_count": 0
        }
