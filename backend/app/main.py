from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base, SessionLocal
import app.models
from app.models.user import User
from app.models.setting import HotelConfig
from app.utils.security import hash_password

#importar routers
from app.routers.rooms import router as rooms_routers
from app.routers.clients import router as clients_routers
from app.routers.reservations import router as reservations_router
from app.routers.payments import router as payments_router
from app.routers.reports import router as reports_router
from app.routers.auth import router as auth_router
from app.routers.settings import router as settings_router
from app.routers.users import router as users_router

# Crear tablas al iniciar la aplicación
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Al iniciar
    print("🏨 Iniciando Sistema de Gestión Hotelera...")
    Base.metadata.create_all(bind=engine)
    print("✅ Base de datos lista")
    
    db = SessionLocal()
    try:
        # Crear usuarios por defecto si no existen
        admin_exists = db.query(User).filter(User.username == "admin").first()
        if not admin_exists:
            print("👤 Creando usuario administrador por defecto...")
            default_pwd = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")
            admin_user = User(
                username="admin",
                password_hash=hash_password(default_pwd),
                nombre_completo="Administrador de Hotel",
                rol="admin",
                activo=True
            )
            db.add(admin_user)
            db.commit()
            print(f"✅ Usuario admin creado con éxito (admin / {default_pwd})")
            
        recep_exists = db.query(User).filter(User.username == "recepcionista").first()
        if not recep_exists:
            print("👤 Creando usuario recepcionista por defecto...")
            recep_pwd = os.getenv("DEFAULT_RECEP_PASSWORD", "recep123")
            recep_user = User(
                username="recepcionista",
                password_hash=hash_password(recep_pwd),
                nombre_completo="Recepcionista Turno A",
                rol="recepcionista",
                activo=True
            )
            db.add(recep_user)
            db.commit()
            print(f"✅ Usuario recepcionista creado con éxito (recepcionista / {recep_pwd})")

        # Crear configuración del hotel por defecto si no existe
        config_exists = db.query(HotelConfig).first()
        if not config_exists:
            print("🏨 Creando configuración del hotel por defecto...")
            default_config = HotelConfig(
                nombre="Grand Hotel",
                eslogan="La mejor experiencia de descanso",
                ruc="20501234567",
                telefono="(01) 555-1234",
                direccion="Av. Principal 123, Lima",
                email="contacto@grandhotel.com"
            )
            db.add(default_config)
            db.commit()
            print("✅ Configuración del hotel inicializada")
    except Exception as e:
        print(f"❌ Error al inicializar base de datos: {e}")
    finally:
        db.close()
        
    yield
    # Al cerrar
    print("👋 Cerrando sistema...")


# Crear la aplicación FastAPI
app = FastAPI(
    title="Sistema de Gestión Hotelera",
    description="API para administrar habitaciones, clientes, reservas y pagos",
    version="1.0.0",
    lifespan=lifespan
)

# Crear carpeta estática si no existe antes de montarla
os.makedirs("static", exist_ok=True)

# Montar la ruta de archivos estáticos
app.mount("/static", StaticFiles(directory="static"), name="static")

# Configurar CORS dinámico para permitir entornos de producción
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Ruta de prueba
@app.get("/", tags=["Sistema"])
async def root():
    return {
        "sistema": "Gestión Hotelera",
        "version": "1.0.0",
        "estado": "funcionando",
        "documentacion": "/docs"
    }


# Ruta de salud del sistema
@app.get("/health", tags=["Sistema"])
async def health_check():
    return {
        "estado": "ok",
        "base_de_datos": "conectada"
    }

# Registrar routers
app.include_router(auth_router)
app.include_router(rooms_routers)
app.include_router(clients_routers)
app.include_router(reservations_router)
app.include_router(payments_router)
app.include_router(reports_router)
app.include_router(settings_router)
app.include_router(users_router)