from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Clave foránea
    reserva_id = Column(Integer, ForeignKey("reservations.id"), nullable=False)

    # Detalles del pago
    monto = Column(Float, nullable=False)
    metodo_pago = Column(String(20), nullable=False)  # efectivo, tarjeta, transferencia
    tipo_pago = Column(String(20), nullable=False)     # adelanto, pago_parcial, pago_total, devolucion
    referencia = Column(String(100), nullable=True)    # Número de comprobante
    observaciones = Column(String(500), nullable=True)

    # Timestamps
    fecha_pago = Column(DateTime(timezone=True), server_default=func.now())
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    # Relación
    reserva = relationship("Reservation", back_populates="pagos")

    def __repr__(self):
        return f"<Payment {self.id} - Reserva:{self.reserva_id} Monto:{self.monto}>"