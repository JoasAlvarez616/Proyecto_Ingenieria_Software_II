from sqlalchemy import Column, Integer, String
from app.database import Base

class HotelConfig(Base):
    __tablename__ = "hotel_config"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, default="Grand Hotel")
    eslogan = Column(String(200), nullable=True, default="La mejor experiencia de descanso")
    ruc = Column(String(20), nullable=True, default="20501234567")
    telefono = Column(String(20), nullable=True, default="(01) 555-1234")
    direccion = Column(String(200), nullable=True, default="Av. Principal 123, Lima")
    email = Column(String(100), nullable=True, default="contacto@grandhotel.com")
    logo_url = Column(String(500), nullable=True)

    def __repr__(self):
        return f"<HotelConfig {self.nombre}>"
