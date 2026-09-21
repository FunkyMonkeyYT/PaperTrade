import os
import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from limits import strategies, parse
from limits.storage import MemoryStorage

from database import engine, Base, init_db
from routers.health import router as health_router
from routers.stock import router as stock_router
from routers.trading import router as trading_router
from routers.auth import router as auth_router

load_dotenv()

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("quant_api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schemas on startup
    logger.info("Initializing Standalone Trading Simulator Database...")
    init_db()
    logger.info("Standalone Stock Trading Simulator & Quant Engine is ready.")
    yield
    logger.info("Shutting down Trading Simulator API.")

app = FastAPI(
    title="Standalone Stock Trading Simulator & Quantitative Platform",
    description="Algorithmic Quantitative Market Analytics, Technical Indicators, and Paper Trading Simulation.",
    version="1.0.0",
    lifespan=lifespan
)

# ---------------------------------------------------------------------------
# CORS — Whitelist only known origins (loaded from env var)
# ---------------------------------------------------------------------------
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
allowed_origins = [o.strip() for o in allowed_origins_str.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Rate Limiting Configuration
# ---------------------------------------------------------------------------
rate_limit_storage = MemoryStorage()
rate_limit_strategy = strategies.FixedWindowRateLimiter(rate_limit_storage)
global_rate_limit = parse("200/minute")
auth_rate_limit = parse("5/15 minutes")     # 5 attempts per 15 min on auth routes

# Maximum request body size (1 MB)
MAX_BODY_SIZE = 1 * 1024 * 1024

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    ip = request.client.host if request.client else "127.0.0.1"
    path = request.url.path

    # --- Body size limit (reject oversized payloads) ---
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_SIZE:
        return JSONResponse(
            status_code=413,
            content={"detail": "Request body too large. Maximum size is 1 MB."}
        )

    # --- Rate limiting ---
    # Stricter rate limits for authentication endpoints
    if (
        path.startswith("/api/auth/login")
        or path.startswith("/api/auth/register")
        or path.startswith("/api/auth/google")
    ):
        if not rate_limit_strategy.hit(auth_rate_limit, ip, path):
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many authentication attempts. Please try again in 15 minutes."}
            )
    else:
        # Global rate limit for all other endpoints
        if not rate_limit_strategy.hit(global_rate_limit, ip, "global"):
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Too many requests."}
            )

    return await call_next(request)

# Register Routers
app.include_router(health_router)
app.include_router(stock_router)
app.include_router(trading_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "platform": "Standalone Stock Trading Simulator & Quantitative Platform",
        "status": "online",
        "docs_url": "/docs",
        "health_check": "/api/health",
        "endpoints": {
            "metrics": "/api/stock/{ticker}/metrics",
            "export_ml": "/api/stock/{ticker}/export?format=csv",
            "portfolio": "/api/trading/portfolio",
            "order": "/api/trading/order",
            "transactions": "/api/trading/transactions",
            "search": "/api/stock/search"
        },
        "version": "1.0.0"
    }

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log full error details server-side; never expose them to the client
    logger.error(f"Global exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error."}
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
