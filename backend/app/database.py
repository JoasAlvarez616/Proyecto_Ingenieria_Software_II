from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from pathlib import Path
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# URL de la base de datos
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database/hotel.db")

# SQLAlchemy 1.4+ requiere que la URL de PostgreSQL comience con postgresql:// en lugar de postgres://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# --- Creación automática del directorio (profesional) ---
# Extraer la ruta del archivo de la URL SQLite solo si es SQLite
if DATABASE_URL.startswith("sqlite:///"):
    db_path = DATABASE_URL.replace("sqlite:///", "")
    # Eliminar './' si existe al inicio
    if db_path.startswith("./"):
        db_path = db_path[2:]
    
    # Crear el directorio padre si existe y no está vacío
    db_dir = os.path.dirname(db_path)
    if db_dir:
        Path(db_dir).mkdir(parents=True, exist_ok=True)
# -------------------------------------------------------

# Argumentos de conexión específicos para SQLite
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# Crear motor de la base de datos
engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False  # Cambiar a True para ver SQL logs en desarrollo
)

# Crear sesión local
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()

# Dependencia para obtener la sesión de base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()