import time
import threading
from typing import Any, Optional, Dict, Tuple

class ThreadSafeTTLCache:
    """
    In-memory thread-safe TTL cache with automatic expiry.
    Prevents redundant yfinance queries and reduces API latency.
    """
    def __init__(self, default_ttl_seconds: int = 180):
        self._cache: Dict[str, Tuple[Any, float]] = {}
        self._lock = threading.Lock()
        self._default_ttl = default_ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key not in self._cache:
                return None
            val, expiry = self._cache[key]
            if time.time() > expiry:
                del self._cache[key]
                return None
            return val

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        with self._lock:
            self._cache[key] = (value, time.time() + ttl)

    def delete(self, key: str) -> None:
        with self._lock:
            if key in self._cache:
                del self._cache[key]

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()

# Global market metrics cache (3 minutes)
metrics_cache = ThreadSafeTTLCache(default_ttl_seconds=180)
