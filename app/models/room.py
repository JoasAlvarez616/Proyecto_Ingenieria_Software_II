from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    numero= Column(String(10), unique=True, nullable=False, index=True)
    tipo= Column(String(50), nullable=False)
    capacidad= Column(Integer, nullable=False)
    precio_base= Column(Float, nullable=False)
    estado= Column(String(20), default="disponible")
    descripcion= Column(String(500), nullable=True)
    activa= Column(Boolean, default=True)

    #Timestamps
    creado_en = Column(DateTime(timezone=True), server_default=func.now())
    actualizado_en = Column(DateTime(timezone=True), onupdate=func.now())
    reservas = relationship("Reservation", back_populates="habitacion")

    def __repr__(self):
        return f"<Room {self.numero} - {self.tipo}>"
