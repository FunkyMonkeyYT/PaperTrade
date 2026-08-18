import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, "trading_simulator.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH.replace(os.sep, '/')}")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


from sqlalchemy import text

Base = declarative_base()

def init_db():
    """Initializes database tables and executes automatic column additions if needed."""
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        # Check and add users columns
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN updated_at DATETIME"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN default_country VARCHAR(20) DEFAULT 'US'"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN default_currency VARCHAR(10) DEFAULT 'USD'"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500)"))
            conn.commit()
        except Exception:
            pass

        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_onboarded BOOLEAN DEFAULT 0"))
            conn.commit()
        except Exception:
            pass

        # Check and add portfolios columns
        try:
            conn.execute(text("ALTER TABLE portfolios ADD COLUMN currency VARCHAR(10) DEFAULT 'USD'"))
            conn.commit()
        except Exception:
            pass

def get_db():
    """FastAPI Dependency for database session management."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

