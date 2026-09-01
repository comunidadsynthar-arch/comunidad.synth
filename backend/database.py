import os
import tempfile
import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

def sanitize_database_url(url: str) -> str:
    if not url:
        return url
    
    url = url.strip()
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
        
    if not url.startswith("postgresql://"):
        return url
        
    try:
        scheme, rest = url.split("://", 1)
        if "@" in rest:
            last_at_idx = rest.rfind("@")
            creds_part = rest[:last_at_idx]
            host_part = rest[last_at_idx + 1:]
            
            if ":" in creds_part:
                user, password = creds_part.split(":", 1)
                # Decode first in case already partially encoded, then encode properly
                decoded_pass = urllib.parse.unquote_plus(password)
                clean_password = urllib.parse.quote_plus(decoded_pass)
                return f"{scheme}://{user}:{clean_password}@{host_part}"
    except Exception as e:
        print(f"Notice during URL sanitation: {e}")
        
    return url

# Read from env (Supabase Postgres) or fallback to writable /tmp SQLite
RAW_DATABASE_URL = os.getenv("DATABASE_URL")

if not RAW_DATABASE_URL or RAW_DATABASE_URL.strip() == "":
    db_path = os.path.join(tempfile.gettempdir(), "synth_argentina.db")
    DATABASE_URL = f"sqlite:///{db_path}"
else:
    DATABASE_URL = sanitize_database_url(RAW_DATABASE_URL)

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
        pool_pre_ping=True
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
