from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre_completo = Column(String(100), nullable=False)
    tipo_documento = Column(String(20), nullable=False)  # cedula, pasaporte
    numero_documento = Column(String(30), unique=True, nullable=False, index=True)
    telefono = Column(String(20), nullable=False)
    email = Column(String(100), nullable=True)
    direccion = Column(String(200), nullable=True)
    activo = Column(Boolean, default=True)
    es_extranjero = Column(Boolean, default=False, nullable=False)
    pais = Column(String(50), default="Colombia", nullable=False)

    # Timestamps
    creado_en = Column(DateTime(timezone=True), server_default=func.now())
    actualizado_en = Column(DateTime(timezone=True), onupdate=func.now())

    # Relación con reservas
    reservas = relationship("Reservation", back_populates="cliente")

    def __repr__(self):
        return f"<Client {self.nombre_completo} - {self.numero_documento}>"