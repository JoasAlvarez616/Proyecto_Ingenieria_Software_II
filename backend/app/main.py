from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base
import app.models

#importar routers
from app.routers.rooms import router as rooms_routers
from app.routers.clients import router as clients_routers
from app.routers.reservations import router as reservations_router
from app.routers.payments import router as payments_router
from app.routers.reports import router as reports_router



# Crear tablas al iniciar la aplicación
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Al iniciar
    print("🏨 Iniciando Sistema de Gestión Hotelera...")
    Base.metadata.create_all(bind=engine)
    print("✅ Base de datos lista")
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


# Configurar CORS (permite que el frontend se comunique con el backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # En producción, especificar el dominio del frontend
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
app.include_router(rooms_routers)
app.include_router(clients_routers)
app.include_router(reservations_router)
app.include_router(payments_router)
app.include_router(reports_router)