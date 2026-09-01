import os
import tempfile
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Read from env (Supabase Postgres) or fallback to writable /tmp SQLite
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL or DATABASE_URL.strip() == "":
    db_path = os.path.join(tempfile.gettempdir(), "synth_argentina.db")
    DATABASE_URL = f"sqlite:///{db_path}"

# Fix Heroku/Vercel postgres:// URI scheme for SQLAlchemy
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite requires different connect args than PostgreSQL
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # PostgreSQL configuration for Supabase
    engine = create_engine(
        DATABASE_URL,
        pool_size=3,
        max_overflow=5,
        pool_recycle=300,
        pool_pre_ping=True  # Auto-reconnect if serverless connection drops
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get db session in FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
