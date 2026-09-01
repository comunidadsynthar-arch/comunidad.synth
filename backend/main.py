import os
import pathlib
from fastapi import FastAPI, Depends, HTTPException, status, Response, Cookie
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from pydantic import BaseModel

from backend.database import engine, get_db, Base
from backend.models import User, BrandProfile, MusicianProfile, Donation
from backend.auth import (
    create_access_token, 
    verify_google_token, 
    get_current_user, 
    check_role
)

# Initialize Database tables safely
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database initialization notice: {e}")

app = FastAPI(title="Synth Argentina Portal API", redirect_slashes=False)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class GoogleAuthRequest(BaseModel):
    id_token: str

class MockAuthRequest(BaseModel):
    email: str
    name: str
    role: Optional[str] = "pending"

class SelectRoleRequest(BaseModel):
    role: str

class BrandProfileRequest(BaseModel):
    brand_name: str
    description: Optional[str] = ""
    website: Optional[str] = ""
    space_requested: float
    electricity_needs: str
    products: Optional[str] = ""

class MusicianProfileRequest(BaseModel):
    artist_name: str
    genre: Optional[str] = ""
    bio: Optional[str] = ""
    links: Optional[str] = ""
    setup_description: Optional[str] = ""
    technical_rider: Optional[str] = ""

class DonationRequest(BaseModel):
    amount: float

# --- Authentication Routes (Dual Decorators for Vercel Serverless) ---

@app.post("/api/auth/google")
@app.post("/auth/google")
def auth_google(auth_req: GoogleAuthRequest, response: Response, db: Session = Depends(get_db)):
    # Verify Google token
    token_info = verify_google_token(auth_req.id_token)
    if not token_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de Google inválido"
        )
        
    email = token_info.get("email")
    name = token_info.get("name", "")
    google_id = token_info.get("sub")
    
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Create new user, defaults to 'pending' role until chosen
        user = User(email=email, full_name=name, google_id=google_id, role="pending")
        db.add(user)
        db.commit()
        db.refresh(user)
    elif google_id and not user.google_id:
        # Link google id if not already linked
        user.google_id = google_id
        db.commit()
        db.refresh(user)

    # Generate local JWT
    access_token = create_access_token(data={"email": user.email, "role": user.role})
    
    # Save JWT in HttpOnly Cookie
    response.set_cookie(
        key="session_token",
        value=access_token,
        httponly=True,
        max_age=86400, # 1 day in seconds
        samesite="lax",
        secure=False
    )
    
    return {
        "email": user.email,
        "name": user.full_name,
        "role": user.role,
        "is_approved": user.is_approved
    }

@app.post("/api/auth/mock")
@app.post("/auth/mock")
def auth_mock(auth_req: MockAuthRequest, response: Response, db: Session = Depends(get_db)):
    """Mock authentication endpoint for local development without Google configuration"""
    email = auth_req.email.strip().lower()
    name = auth_req.name.strip()
    role = auth_req.role
    
    if not email:
        raise HTTPException(status_code=400, detail="El email es requerido")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Default mock admin if email contains 'admin'
        if "admin" in email and role == "pending":
            role = "admin"
        
        user = User(email=email, full_name=name, role=role, is_approved=(role in ["admin", "donor", "pending"]))
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # If user exists and role was requested, update role
        if role != "pending" and user.role != role:
            user.role = role
            user.is_approved = (role in ["admin", "donor", "pending"])
            db.commit()
            db.refresh(user)

    access_token = create_access_token(data={"email": user.email, "role": user.role})
    
    response.set_cookie(
        key="session_token",
        value=access_token,
        httponly=True,
        max_age=86400,
        samesite="lax",
        secure=False
    )
    
    return {
        "email": user.email,
        "name": user.full_name,
        "role": user.role,
        "is_approved": user.is_approved
    }

@app.post("/api/auth/logout")
@app.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie(key="session_token")
    return {"message": "Sesión cerrada correctamente"}

@app.get("/api/auth/me")
@app.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = None
    if current_user.role == "brand" and current_user.brand_profile:
        profile = {
            "brand_name": current_user.brand_profile.brand_name,
            "description": current_user.brand_profile.description,
            "website": current_user.brand_profile.website,
            "space_requested": current_user.brand_profile.space_requested,
            "electricity_needs": current_user.brand_profile.electricity_needs,
            "products": current_user.brand_profile.products,
        }
    elif current_user.role == "musician" and current_user.musician_profile:
        profile = {
            "artist_name": current_user.musician_profile.artist_name,
            "genre": current_user.musician_profile.genre,
            "bio": current_user.musician_profile.bio,
            "links": current_user.musician_profile.links,
            "setup_description": current_user.musician_profile.setup_description,
            "technical_rider": current_user.musician_profile.technical_rider,
        }
        
    return {
        "email": current_user.email,
        "name": current_user.full_name,
        "role": current_user.role,
        "is_approved": current_user.is_approved,
        "profile": profile
    }

@app.post("/api/auth/select-role")
@app.post("/auth/select-role")
def select_role(role_req: SelectRoleRequest, response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "pending":
        raise HTTPException(
            status_code=400,
            detail="Ya has seleccionado un rol previamente"
        )
        
    requested_role = role_req.role.lower()
    if requested_role not in ["brand", "musician", "donor"]:
        raise HTTPException(status_code=400, detail="Rol inválido")
        
    current_user.role = requested_role
    current_user.is_approved = (requested_role == "donor")
    db.commit()
    db.refresh(current_user)
    
    access_token = create_access_token(data={"email": current_user.email, "role": current_user.role})
    response.set_cookie(
        key="session_token",
        value=access_token,
        httponly=True,
        max_age=86400,
        samesite="lax",
        secure=False
    )
    
    return {"role": current_user.role, "is_approved": current_user.is_approved}

# --- Profiles registration ---

@app.post("/api/profile/brand")
@app.post("/profile/brand")
def save_brand_profile(profile_req: BrandProfileRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, ["brand"])
    
    profile = current_user.brand_profile
    if not profile:
        profile = BrandProfile(id=current_user.id)
        db.add(profile)
        
    profile.brand_name = profile_req.brand_name
    profile.description = profile_req.description
    profile.website = profile_req.website
    profile.space_requested = profile_req.space_requested
    profile.electricity_needs = profile_req.electricity_needs
    profile.products = profile_req.products
    
    db.commit()
    return {"message": "Perfil de marca guardado correctamente. Pendiente de aprobación por administración."}

@app.post("/api/profile/musician")
@app.post("/profile/musician")
def save_musician_profile(profile_req: MusicianProfileRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, ["musician"])
    
    profile = current_user.musician_profile
    if not profile:
        profile = MusicianProfile(id=current_user.id)
        db.add(profile)
        
    profile.artist_name = profile_req.artist_name
    profile.genre = profile_req.genre
    profile.bio = profile_req.bio
    profile.links = profile_req.links
    profile.setup_description = profile_req.setup_description
    profile.technical_rider = profile_req.technical_rider
    
    db.commit()
    return {"message": "Perfil de músico guardado correctamente. Pendiente de aprobación por administración."}

# --- Donations Routes ---

@app.post("/api/donations/create")
@app.post("/donations/create")
def create_donation(don_req: DonationRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, ["donor", "admin", "brand", "musician"])
    
    donation = Donation(
        user_id=current_user.id,
        amount=don_req.amount,
        currency="ARS",
        status="completed"
    )
    db.add(donation)
    db.commit()
    db.refresh(donation)
    
    return {"message": "¡Donación registrada con éxito! Muchas gracias por apoyar a la escena.", "amount": donation.amount}

@app.get("/api/donations/my")
@app.get("/donations/my")
def get_my_donations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    donations = db.query(Donation).filter(Donation.user_id == current_user.id).order_by(Donation.created_at.desc()).all()
    return [{
        "amount": d.amount,
        "currency": d.currency,
        "status": d.status,
        "created_at": d.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for d in donations]

# --- Admin Routes ---

@app.get("/api/admin/stats")
@app.get("/admin/stats")
def get_admin_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, ["admin"])
    
    total_users = db.query(User).count()
    total_brands = db.query(BrandProfile).count()
    total_musicians = db.query(MusicianProfile).count()
    
    total_space = db.query(func.sum(BrandProfile.space_requested)).scalar() or 0.0
    total_donations = db.query(func.sum(Donation.amount)).filter(Donation.status == "completed").scalar() or 0.0
    
    return {
        "total_users": total_users,
        "total_brands": total_brands,
        "total_musicians": total_musicians,
        "total_space_requested_m2": total_space,
        "total_donated_ars": total_donations
    }

@app.get("/api/admin/registrations")
@app.get("/admin/registrations")
def get_registrations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, ["admin"])
    
    users = db.query(User).filter(User.role.in_(["brand", "musician"])).all()
    
    results = []
    for u in users:
        detail = {}
        if u.role == "brand" and u.brand_profile:
            detail = {
                "name": u.brand_profile.brand_name,
                "description": u.brand_profile.description,
                "website": u.brand_profile.website,
                "space_requested": u.brand_profile.space_requested,
                "electricity_needs": u.brand_profile.electricity_needs,
                "products": u.brand_profile.products
            }
        elif u.role == "musician" and u.musician_profile:
            detail = {
                "name": u.musician_profile.artist_name,
                "genre": u.musician_profile.genre,
                "bio": u.musician_profile.bio,
                "links": u.musician_profile.links,
                "setup_description": u.musician_profile.setup_description
            }
        else:
            continue
            
        results.append({
            "user_id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_approved": u.is_approved,
            "created_at": u.created_at.strftime("%Y-%m-%d"),
            "details": detail
        })
        
    return results

@app.post("/api/admin/approve/{user_id}")
@app.post("/admin/approve/{user_id}")
def approve_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, ["admin"])
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    user.is_approved = True
    db.commit()
    return {"message": f"Usuario {user.email} aprobado con éxito"}

@app.post("/api/admin/reject/{user_id}")
@app.post("/admin/reject/{user_id}")
def reject_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    check_role(current_user, ["admin"])
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    user.is_approved = False
    db.commit()
    return {"message": f"Aprobación de {user.email} revocada"}

# --- Serving Frontend & Fallbacks ---

BASE_DIR = pathlib.Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
PUBLIC_DIR = BASE_DIR / "public"

SERVE_DIR = PUBLIC_DIR if PUBLIC_DIR.exists() else FRONTEND_DIR

if SERVE_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(SERVE_DIR)), name="static")

@app.get("/")
@app.get("/index.html")
def read_index():
    index_file = SERVE_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "Synth Argentina API is running"}

@app.get("/login")
@app.get("/login.html")
def read_login():
    login_file = SERVE_DIR / "login.html"
    if login_file.exists():
        return FileResponse(str(login_file))
    return {"message": "Login page"}

@app.get("/dashboard")
@app.get("/dashboard.html")
def read_dashboard():
    dash_file = SERVE_DIR / "dashboard.html"
    if dash_file.exists():
        return FileResponse(str(dash_file))
    return {"message": "Dashboard page"}

@app.get("/privacidad")
@app.get("/privacidad.html")
def read_privacidad():
    priv_file = SERVE_DIR / "privacidad.html"
    if priv_file.exists():
        return FileResponse(str(priv_file))
    return {"message": "Política de Privacidad"}

@app.get("/terminos")
@app.get("/terminos.html")
def read_terminos():
    term_file = SERVE_DIR / "terminos.html"
    if term_file.exists():
        return FileResponse(str(term_file))
    return {"message": "Condiciones del Servicio"}
