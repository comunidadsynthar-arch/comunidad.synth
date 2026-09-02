import os
import datetime
import urllib.request
import json
import jwt
from fastapi import Request, HTTPException, Depends, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User

# Secure configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "synth_argentina_secret_key_123456789")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "569194393356-hsgl6ivaojieom22mrkm6sstdc4j5kg6.apps.googleusercontent.com")

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

# Verify Google ID Token using standard urllib (no extra dependencies required)
def verify_google_token(id_token: str) -> dict:
    try:
        # Query Google's token verification endpoint
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
        req = urllib.request.Request(url, headers={"User-Agent": "SynthArgentina-Portal/1.0"})
        with urllib.request.urlopen(req, timeout=10) as response:
            token_info = json.loads(response.read().decode())
            
            if "error" in token_info or "error_description" in token_info:
                print(f"Google token verification error: {token_info}")
                return None
                
            # If Google Client ID is configured, verify audience (aud or azp)
            token_aud = token_info.get("aud") or token_info.get("azp")
            if GOOGLE_CLIENT_ID and token_aud != GOOGLE_CLIENT_ID:
                print(f"Google token audience mismatch: {token_aud} vs {GOOGLE_CLIENT_ID}")
                return None
                
            return token_info
    except Exception as e:
        print(f"Exception during Google token verification: {e}")
        return None

# Authorized Administrators
COMMUNITY_EMAIL = os.getenv("COMMUNITY_EMAIL", "comunidad.synth.ar@gmail.com").strip().lower()
ALLOWED_ADMIN_EMAILS = {"aledflores@gmail.com", COMMUNITY_EMAIL}

def is_admin_email(email: str) -> bool:
    if not email:
        return False
    return email.strip().lower() in ALLOWED_ADMIN_EMAILS

# Dependency to check JWT from HttpOnly Cookie
def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No se encontró token de sesión",
        )
    
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )
        
    email = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
        )
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )

    # Auto-heal: Ensure authorized admin emails always retain the admin role and approval
    if is_admin_email(user.email) and (user.role != "admin" or not user.is_approved):
        user.role = "admin"
        user.is_approved = True
        try:
            db.commit()
            db.refresh(user)
        except Exception as e:
            db.rollback()
            print(f"Notice auto-healing admin role: {e}")

    return user

# Role-specific checks
def check_role(user: User, required_roles: list):
    # Administrators have universal access to all profiles and resources
    if user.role == "admin" or is_admin_email(user.email):
        return True

    if user.role not in required_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permiso denegado. Se requiere rol: {', '.join(required_roles)}",
        )
    return True
