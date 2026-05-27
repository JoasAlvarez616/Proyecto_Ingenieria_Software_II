from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


# Campos comunes
class RoomBase(BaseModel):
    numero: str = Field(..., min_length=1, max_length=10, description="Número de habitación")
    tipo: str = Field(..., description="Tipo: simple, doble, suite")
    capacidad: int = Field(..., gt=0, le=10, description="Capacidad máxima de personas")
    precio_base: float = Field(..., gt=0, description="Precio base por noche")
    descripcion: Optional[str] = Field(None, max_length=500)

    @field_validator("tipo")
    @classmethod
    def validar_tipo(cls, v):
        tipos_validos = ["simple", "doble", "triple", "suite"]
        if v.lower() not in tipos_validos:
            raise ValueError(f"Tipo debe ser uno de: {tipos_validos}")
        return v.lower()

    @field_validator("numero")
    @classmethod
    def validar_numero(cls, v):
        if not v.strip():
            raise ValueError("El número de habitación no puede estar vacío")
        return v.strip().upper()


# Para crear una habitación
class RoomCreate(RoomBase):
    pass


# Para actualizar una habitación (todos opcionales)
class RoomUpdate(BaseModel):
    tipo: Optional[str] = None
    capacidad: Optional[int] = Field(None, gt=0, le=10)
    precio_base: Optional[float] = Field(None, gt=0)
    descripcion: Optional[str] = None
    estado: Optional[str] = None
    activa: Optional[bool] = None

    @field_validator("estado")
    @classmethod
    def validar_estado(cls, v):
        if v is not None:
            estados_validos = ["disponible", "ocupada", "mantenimiento"]
            if v.lower() not in estados_validos:
                raise ValueError(f"Estado debe ser uno de: {estados_validos}")
            return v.lower()
        return v


# Lo que devuelve la API
class RoomResponse(RoomBase):
    id: int
    estado: str
    activa: bool
    creado_en: datetime
    actualizado_en: Optional[datetime] = None

    model_config = {"from_attributes": True}