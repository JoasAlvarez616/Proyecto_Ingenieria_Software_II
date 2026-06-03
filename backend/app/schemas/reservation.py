from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
from datetime import date, datetime


# Campos comunes
class ReservationBase(BaseModel):
    habitacion_id: int = Field(..., gt=0)
    cliente_id: int = Field(..., gt=0)
    fecha_entrada: date
    fecha_salida: date
    numero_huespedes: int = Field(..., gt=0, le=10)
    observaciones: Optional[str] = Field(None, max_length=500)

    @field_validator("fecha_entrada")
    @classmethod
    def validar_fecha_entrada(cls, v):
        if v < date.today():
            raise ValueError("La fecha de entrada no puede ser en el pasado")
        return v

    @model_validator(mode="after")
    def validar_fechas(self):
        if self.fecha_salida <= self.fecha_entrada:
            raise ValueError("La fecha de salida debe ser mayor a la fecha de entrada")
        return self


# Para crear una reserva
class ReservationCreate(ReservationBase):
    pass


# Para actualizar una reserva
class ReservationUpdate(BaseModel):
    fecha_entrada: Optional[date] = None
    fecha_salida: Optional[date] = None
    numero_huespedes: Optional[int] = Field(None, gt=0, le=10)
    observaciones: Optional[str] = Field(None, max_length=500)
    estado: Optional[str] = None

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v):
        if v is not None:
            estados_validos = ["pendiente", "confirmada", "en_curso", "completada", "cancelada"]
            if v.lower() not in estados_validos:
                raise ValueError(f"Estado debe ser uno de: {estados_validos}")
            return v.lower()
        return v


# Lo que devuelve la API
class ReservationResponse(BaseModel):
    id: int
    habitacion_id: int
    cliente_id: int
    fecha_entrada: date
    fecha_salida: date
    numero_huespedes: int
    numero_noches: int
    precio_por_noche: float
    costo_total: float
    monto_pagado: float
    estado: str
    observaciones: Optional[str] = None
    creado_en: datetime
    actualizado_en: Optional[datetime] = None
    cancelado_en: Optional[datetime] = None

    model_config = {"from_attributes": True}


# Schema resumido para listar reservas
class ReservationSummary(BaseModel):
    id: int
    habitacion_id: int
    cliente_id: int
    fecha_entrada: date
    fecha_salida: date
    numero_noches: int
    numero_huespedes: int
    costo_total: float
    monto_pagado: float
    estado: str
    creado_en: datetime
    actualizado_en: Optional[datetime] = None
    cancelado_en: Optional[datetime] = None

    model_config = {"from_attributes": True}