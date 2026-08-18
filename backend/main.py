import os
import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

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

# Configure CORS
cors_origins_raw = os.getenv("CORS_ORIGINS", '["*"]')
try:
    cors_origins = json.loads(cors_origins_raw)
except Exception:
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins if isinstance(cors_origins, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    logger.error(f"Global exception on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("main:app", host=host, port=port, reload=True)
