from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Claves foráneas (relaciones)
    habitacion_id = Column(Integer, ForeignKey("rooms.id"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    
    # Fechas
    fecha_entrada = Column(Date, nullable=False)
    fecha_salida = Column(Date, nullable=False)
    
    # Detalles
    numero_huespedes = Column(Integer, nullable=False)
    numero_noches = Column(Integer, nullable=False)        # Calculado automáticamente
    precio_por_noche = Column(Float, nullable=False)       # Snapshot del precio
    costo_total = Column(Float, nullable=False)            # numero_noches × precio_por_noche
    monto_pagado = Column(Float, default=0.0)              # Suma de pagos recibidos
    
    # Estado
    estado = Column(String(20), default="pendiente")
    # pendiente → confirmada → en_curso → completada
    #                    ↓
    #                cancelada
    
    observaciones = Column(String(500), nullable=True)
    
    # Timestamps
    creado_en = Column(DateTime(timezone=True), server_default=func.now())
    actualizado_en = Column(DateTime(timezone=True), onupdate=func.now())
    cancelado_en = Column(DateTime(timezone=True), nullable=True)

    # Relaciones
    habitacion = relationship("Room", back_populates="reservas")
    cliente = relationship("Client", back_populates="reservas")
    pagos = relationship("Payment", back_populates="reserva")

    def __repr__(self):
        return f"<Reservation {self.id} - Cliente:{self.cliente_id} Hab:{self.habitacion_id}>"