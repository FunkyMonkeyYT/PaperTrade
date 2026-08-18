from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/api", tags=["Health Check"])

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Standalone Stock Trading Simulator & Quant Engine",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0"
    }
