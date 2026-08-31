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
    role = Column(String, default="pending")  # admin, brand, musician, donor, pending
    is_approved = Column(Boolean, default=False)  # Admin approves brands/musicians
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    brand_profile = relationship("BrandProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    musician_profile = relationship("MusicianProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    donations = relationship("Donation", back_populates="user")

class BrandProfile(Base):
    __tablename__ = "brand_profiles"

    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    brand_name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    website = Column(String, nullable=True)
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
    setup_description = Column(String, nullable=True)  # Synthesizers, Eurorack, etc.
    technical_rider = Column(String, nullable=True)

    user = relationship("User", back_populates="musician_profile")

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
