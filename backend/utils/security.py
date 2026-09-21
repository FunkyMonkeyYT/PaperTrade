import os
import hmac
import hashlib
import base64
import json
import time
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load .env before reading any environment variables
load_dotenv()

# Secret key for JWT signature — MUST be set via environment variable
SECRET_KEY = os.getenv("APP_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "FATAL: APP_SECRET_KEY environment variable is not set. "
        "Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\" "
        "and add it to backend/.env"
    )
DEFAULT_TOKEN_EXPIRY_SECONDS = 30 * 24 * 3600  # 30 days default session

def hash_password(password: str) -> str:
    """
    Hashes a password using PBKDF2-HMAC-SHA256 with 260,000 iterations and a unique salt.
    Format: pbkdf2:sha256:260000$<salt_hex>$<hash_hex>
    """
    if not password:
        raise ValueError("Password cannot be empty.")
    salt = os.urandom(16).hex()
    iterations = 260000
    hash_bytes = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        bytes.fromhex(salt),
        iterations
    )
    hash_hex = hash_bytes.hex()
    return f"pbkdf2:sha256:{iterations}${salt}${hash_hex}"

def verify_password(password: str, hashed: str) -> bool:
    """
    Verifies a plain-text password against a stored PBKDF2 hash using constant-time comparison.
    """
    if not password or not hashed:
        return False
    try:
        parts = hashed.split('$')
        if len(parts) != 3:
            return False
        algo_iter, salt_hex, expected_hash_hex = parts
        iterations = int(algo_iter.split(':')[2])
        computed_hash_bytes = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            bytes.fromhex(salt_hex),
            iterations
        )
        return hmac.compare_digest(computed_hash_bytes.hex(), expected_hash_hex)
    except Exception:
        return False

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def _base64url_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += '=' * padding
    return base64.urlsafe_b64decode(data.encode('utf-8'))

def create_access_token(payload: Dict[str, Any], expires_in: int = DEFAULT_TOKEN_EXPIRY_SECONDS) -> str:
    """
    Generates a secure HMAC-SHA256 signed JWT token without external heavy dependencies.
    """
    header = {"alg": "HS256", "typ": "JWT"}
    claims = dict(payload)
    now = int(time.time())
    claims["iat"] = now
    claims["exp"] = now + expires_in

    header_b64 = _base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_b64 = _base64url_encode(json.dumps(claims, separators=(',', ':')).encode('utf-8'))
    
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    sig_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates HMAC-SHA256 signature and expiration for an access token.
    """
    if not token or not isinstance(token, str):
        return None
    token = token.strip()
    if token.startswith("Bearer "):
        token = token[7:].strip()

    parts = token.split('.')
    if len(parts) != 3:
        return None

    header_b64, payload_b64, sig_b64 = parts
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    expected_sig_b64 = _base64url_encode(expected_sig)

    if not hmac.compare_digest(sig_b64, expected_sig_b64):
        return None

    try:
        payload_json = _base64url_decode(payload_b64).decode('utf-8')
        payload = json.loads(payload_json)
        # Check expiration
        if "exp" in payload and payload["exp"] < int(time.time()):
            return None
        return payload
    except Exception:
        return None
