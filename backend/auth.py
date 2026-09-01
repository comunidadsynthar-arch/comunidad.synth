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
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=5) as response:
            token_info = json.loads(response.read().decode())
            
            if "error_description" in token_info:
                print(f"Google token verification error: {token_info['error_description']}")
                return None
                
            # If Google Client ID is configured, verify the audience (aud)
            if GOOGLE_CLIENT_ID and token_info.get("aud") != GOOGLE_CLIENT_ID:
                print("Google token audience mismatch")
                return None
                
            return token_info
    except Exception as e:
        print(f"Exception during Google token verification: {e}")
        return None

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
    return user

# Role-specific checks
def check_role(user: User, required_roles: list):
    if user.role not in required_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permiso denegado. Se requiere rol: {', '.join(required_roles)}",
        )
    return True
