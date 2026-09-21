import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Header, Query
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from database import get_db
from models.database_models import User, Portfolio
from models.schemas import (
    RegisterRequest,
    LoginRequest,
    GoogleAuthRequest,
    AvatarUpdateRequest,
    AuthTokenResponse,
    UserProfileResponse,
    OnboardingRequest,
    EmailLoginRequest,
    ChangePasswordRequest,
    MarketProfileItem,
    MarketStatusInfo
)
from utils.security import create_access_token, decode_access_token, hash_password, verify_password
from services.trading_engine import TradingEngine
from services.quant_engine import QuantEngine

logger = logging.getLogger("auth_router")
router = APIRouter(prefix="/api/auth", tags=["User Authentication & Market Profiles"])


def get_current_user_optional(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_email: Optional[str] = Header(None, alias="X-User-Email"),
    x_user_username: Optional[str] = Header(None, alias="X-User-Username"),
    email: Optional[str] = Query(None),
    username: Optional[str] = Query(None),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Dependency resolving current authenticated user:
    1. Checks JWT bearer token from Authorization header.
    2. Fallbacks to X-User-Username or X-User-Email headers if token not provided.
    """
    # 1. Check Bearer Token
    if authorization and authorization.strip():
        payload = decode_access_token(authorization)
        if payload and "user_id" in payload:
            user = db.query(User).filter(User.id == payload["user_id"]).first()
            if user:
                return user

    # 2. Check Username
    target_username = (x_user_username or username or "").strip()
    if target_username:
        user = db.query(User).filter(User.username.ilike(target_username)).first()
        if user:
            return user

    # 3. Check Email
    target_email = (x_user_email or email or "").strip()
    if target_email and "@" in target_email:
        user = db.query(User).filter(User.email.ilike(target_email)).first()
        if user:
            return user

    return None


def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
) -> User:
    """Dependency requiring authenticated user or resolving default fallback user."""
    if user:
        return user
    # Fallback to default user
    return TradingEngine.get_or_create_user(db)


def format_user_profile(user: User) -> UserProfileResponse:
    return UserProfileResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        avatar_url=user.avatar_url,
        default_country=user.default_country or "IN",
        default_currency=user.default_currency or "INR",
        is_onboarded=bool(user.is_onboarded),
        created_at=user.created_at.isoformat() if user.created_at else datetime.utcnow().isoformat()
    )


@router.post("/register", response_model=AuthTokenResponse)
def register_user(req: RegisterRequest, db: Session = Depends(get_db)):
    """
    Registers a new secure user with username and password.
    Initializes a $100k starting capital paper trading portfolio.
    Returns access token and user profile for immediate login.
    """
    clean_username = req.username.strip()
    if len(clean_username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters long.")

    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")

    try:
        user = TradingEngine.create_user_with_credentials(
            db=db,
            username=clean_username,
            password=req.password,
            email=req.email,
            avatar_url=req.avatar_url,
            default_country=req.default_country or "IN",
            default_currency=req.default_currency
        )

        token = create_access_token({
            "user_id": user.id,
            "username": user.username,
            "email": user.email
        })

        return AuthTokenResponse(
            access_token=token,
            token_type="bearer",
            user=format_user_profile(user)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error for {clean_username}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Registration failed. Please try again later.")


@router.post("/google", response_model=AuthTokenResponse)
def google_auth_login(req: GoogleAuthRequest, db: Session = Depends(get_db)):
    """
    Authenticates or creates a user account via Google Sign-In.
    Extracts Google verified name, avatar photo, and email address.
    """
    try:
        user = TradingEngine.get_or_create_google_user(
            db=db,
            google_id=req.google_id,
            email=req.email,
            name=req.name,
            avatar_url=req.avatar_url,
            default_country=req.default_country or "IN"
        )

        token = create_access_token({
            "user_id": user.id,
            "username": user.username,
            "email": user.email
        })

        return AuthTokenResponse(
            access_token=token,
            token_type="bearer",
            user=format_user_profile(user)
        )
    except Exception as e:
        logger.error(f"Google auth login error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Google authentication failed. Please try again later.")


@router.post("/login", response_model=AuthTokenResponse)
def login_with_password(req: LoginRequest, db: Session = Depends(get_db)):
    """
    Secure password authentication with constant-time hash verification.
    Enables access from any device by entering username/email and password.
    """
    ident = req.username_or_email.strip()
    if not ident:
        raise HTTPException(status_code=400, detail="Please provide your username or email.")

    if not req.password:
        raise HTTPException(status_code=400, detail="Please enter your password.")

    user = TradingEngine.authenticate_user(db, username_or_email=ident, password=req.password)
    if not user:
        # Check if user exists without password (e.g. legacy email user)
        existing_user = TradingEngine.find_user(db, ident)
        if existing_user and not existing_user.password_hash:
            # Upgrade user password automatically on first password login
            existing_user.password_hash = hash_password(req.password)
            existing_user.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_user)
            user = existing_user
        else:
            raise HTTPException(status_code=401, detail="Invalid username/email or password. Please check your credentials.")

    token = create_access_token({
        "user_id": user.id,
        "username": user.username,
        "email": user.email
    })

    return AuthTokenResponse(
        access_token=token,
        token_type="bearer",
        user=format_user_profile(user)
    )


@router.get("/me", response_model=UserProfileResponse)
@router.get("/profile", response_model=UserProfileResponse)
def get_current_profile(user: User = Depends(get_current_user)):
    """Retrieves authenticated user profile."""
    return format_user_profile(user)


@router.post("/avatar", response_model=UserProfileResponse)
def update_profile_avatar(
    req: AvatarUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Updates custom user profile avatar image (URL or data URL)."""
    user.avatar_url = req.avatar_url
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return format_user_profile(user)


@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Securely updates password for authenticated user."""
    if user.password_hash and not verify_password(req.old_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password does not match.")

    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")

    user.password_hash = hash_password(req.new_password)
    user.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Password updated successfully."}


@router.post("/onboard", response_model=UserProfileResponse)
def complete_onboarding(
    req: OnboardingRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Saves user's chosen trading market country & default currency preference."""
    try:
        country_code = req.country.strip().upper()
        currency_map = {
            "IN": "INR",
            "US": "USD",
            "GB": "GBP",
            "JP": "JPY",
            "EU": "EUR",
            "GLOBAL": "USD"
        }
        currency = req.currency or currency_map.get(country_code, "USD")

        user.default_country = country_code
        user.default_currency = currency
        user.is_onboarded = True
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)

        # Update portfolio currency with accurate FX conversion
        TradingEngine.convert_portfolio_currency(db, currency, user_id=user.id)

        return format_user_profile(user)
    except Exception as e:
        logger.error(f"Onboarding error for user {user.username}: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete onboarding. Please try again later.")


@router.get("/market-profiles", response_model=List[MarketProfileItem])
def get_market_profiles():
    """
    Returns all 6 International Market Profiles (India BSE/NSE, Japan TSE/Nikkei,
    UK LSE, US NASDAQ/NYSE, Europe DAX/Euronext, and Global Crypto)
    with live open/closed trading status and registered popular companies.
    """
    try:
        return QuantEngine.get_all_market_profiles()
    except Exception as e:
        logger.error(f"Failed to fetch market profiles: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch market profiles.")


@router.get("/market-status/{country_code}", response_model=MarketStatusInfo)
def get_market_status_by_country(country_code: str):
    """Returns live open/closed status, local time, and countdowns for a specific exchange."""
    try:
        return QuantEngine.get_market_status(country_code)
    except Exception as e:
        logger.error(f"Failed to fetch market status for {country_code}: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch market status.")
