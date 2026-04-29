from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import datetime


# Campos comunes
class PaymentBase(BaseModel):
    reserva_id: int = Field(..., gt=0)
    monto: float = Field(..., gt=0, description="Monto del pago")
    metodo_pago: str = Field(..., description="efectivo, tarjeta, transferencia")
    tipo_pago: str = Field(..., description="adelanto, pago_parcial, pago_total, devolucion")
    referencia: Optional[str] = Field(None, max_length=100)
    observaciones: Optional[str] = Field(None, max_length=500)

    @field_validator("metodo_pago")
    @classmethod
    def validar_metodo_pago(cls, v):
        metodos_validos = ["efectivo", "tarjeta", "transferencia"]
        if v.lower() not in metodos_validos:
            raise ValueError(f"Método de pago debe ser uno de: {metodos_validos}")
        return v.lower()

    @field_validator("tipo_pago")
    @classmethod
    def validar_tipo_pago(cls, v):
        tipos_validos = ["adelanto", "pago_parcial", "pago_total", "devolucion"]
        if v.lower() not in tipos_validos:
            raise ValueError(f"Tipo de pago debe ser uno de: {tipos_validos}")
        return v.lower()

    @field_validator("monto")
    @classmethod
    def validar_monto(cls, v):
        # Redondear a 2 decimales
        return round(v, 2)


# Para crear un pago
class PaymentCreate(PaymentBase):
    pass


# Para actualizar un pago (muy limitado, solo datos administrativos)
class PaymentUpdate(BaseModel):
    referencia: Optional[str] = Field(None, max_length=100)
    observaciones: Optional[str] = Field(None, max_length=500)
    fecha_pago: Optional[datetime] = None


# Lo que devuelve la API
class PaymentResponse(PaymentBase):
    id: int
    fecha_pago: datetime
    creado_en: datetime

    model_config = {"from_attributes": True}


# Schema resumido para listar pagos de una reserva
class PaymentSummary(BaseModel):
    id: int
    monto: float
    metodo_pago: str
    tipo_pago: str
    fecha_pago: datetime
    referencia: Optional[str] = None

    model_config = {"from_attributes": True}


# Schema para el resumen financiero de una reserva
class ReservationPaymentStatus(BaseModel):
    reserva_id: int
    costo_total: float
    monto_pagado: float
    saldo_pendiente: float
    esta_pagado: bool
    pagos: list[PaymentSummary] = []

    model_config = {"from_attributes": True}