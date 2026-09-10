import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    avatar_url = Column(String, nullable=True)  # User profile photo / avatar
    role = Column(String, default="pending")  # admin, brand, musician, collaborator, donor, pending
    is_approved = Column(Boolean, default=False)  # Admin approves brands/musicians/collaborators
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    brand_profile = relationship("BrandProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    musician_profile = relationship("MusicianProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    collaborator_profile = relationship("CollaboratorProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    donations = relationship("Donation", back_populates="user")

class BrandProfile(Base):
    __tablename__ = "brand_profiles"

    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    brand_name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    website = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)  # Brand logo
    gallery_images = Column(String, nullable=True)  # JSON array of product / stand photos
    space_requested = Column(Float, default=1.0)  # in square meters
    electricity_needs = Column(String, default="220V - Simple")  # e.g., Low, Medium, High
    products = Column(String, nullable=True)

    user = relationship("User", back_populates="brand_profile")

class MusicianProfile(Base):
    __tablename__ = "musician_profiles"

    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    artist_name = Column(String, nullable=False)
    genre = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    links = Column(String, nullable=True)  # SoundCloud, Spotify, etc.
    photo_url = Column(String, nullable=True)  # Main artist/press photo
    gallery_images = Column(String, nullable=True)  # JSON array of synths / live performance photos
    setup_description = Column(String, nullable=True)  # Synthesizers, Eurorack, etc.
    technical_rider = Column(String, nullable=True)

    user = relationship("User", back_populates="musician_profile")

class CollaboratorProfile(Base):
    __tablename__ = "collaborator_profiles"

    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    areas_of_interest = Column(String, nullable=False)  # e.g., "Producción, Sonido, Fotografía"
    phone = Column(String, nullable=True)
    availability = Column(String, nullable=True)  # e.g., "Previas y día del evento"
    experience = Column(String, nullable=True)
    notes = Column(String, nullable=True)

    user = relationship("User", back_populates="collaborator_profile")

class Donation(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="ARS")
    status = Column(String, default="completed")  # completed, pending, failed
    payment_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="donations")

class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Optional if visitor is not logged in
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    social_link = Column(String, nullable=True)
    role_relationship = Column(String, nullable=True)  # e.g., Músico, Luthier, Docente, etc.

    # Bloque 1: Visión e Identidad
    vision_core = Column(String, nullable=True)  # JSON list
    access_model = Column(String, nullable=True)
    frequency = Column(String, nullable=True)

    # Bloque 2: Escala
    duration = Column(String, nullable=True)
    attendance_scale = Column(String, nullable=True)
    stands_count = Column(String, nullable=True)
    venue_type = Column(String, nullable=True)  # JSON list

    # Bloque 3: Involucramiento
    involvement_level = Column(String, nullable=True)
    availability_slots = Column(String, nullable=True)  # JSON list

    # Bloque 4: Aportes y Recursos
    skills = Column(String, nullable=True)  # JSON list
    equipment_resources = Column(String, nullable=True)  # JSON list
    equipment_details = Column(String, nullable=True)

    # Bloque 5: Comisiones de trabajo
    first_committee = Column(String, nullable=True)
    second_committee = Column(String, nullable=True)
    coordination_tools = Column(String, nullable=True)  # JSON list

    # Bloque 6: Tareas urgentes e ideas
    priority_tasks = Column(String, nullable=True)  # JSON list of 3 items
    ideas_suggestions = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
