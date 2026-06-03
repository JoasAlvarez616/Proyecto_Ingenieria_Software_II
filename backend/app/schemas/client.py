from pydantic import BaseModel, Field, field_validator, EmailStr
from typing import Optional
from datetime import datetime


# Campos comunes
class ClientBase(BaseModel):
    nombre_completo: str = Field(..., min_length=3, max_length=100)
    tipo_documento: str = Field(..., description="Tipo: cedula, pasaporte")
    numero_documento: str = Field(..., min_length=5, max_length=30)
    telefono: str = Field(..., min_length=7, max_length=20)
    email: Optional[EmailStr] = None
    direccion: Optional[str] = Field(None, max_length=200)
    es_extranjero: bool = Field(default=False)
    pais: str = Field(default="Colombia", max_length=50)

    @field_validator("tipo_documento")
    @classmethod
    def validar_tipo_documento(cls, v):
        tipos_validos = ["cedula", "cedula_extranjeria", "pasaporte", "tarjeta_identidad", "rut", "nit", "ppt"]
        if v.lower() not in tipos_validos:
            raise ValueError(f"Tipo de documento debe ser uno de: {tipos_validos}")
        return v.lower()

    @field_validator("numero_documento")
    @classmethod
    def validar_numero_documento(cls, v):
        if not v.strip():
            raise ValueError("El número de documento no puede estar vacío")
        return v.strip()

    @field_validator("telefono")
    @classmethod
    def validar_telefono(cls, v):
        # Eliminar espacios y guiones para validar
        limpio = v.replace(" ", "").replace("-", "")
        if not limpio.isdigit():
            raise ValueError("El teléfono solo debe contener números")
        return v.strip()

    @field_validator("nombre_completo")
    @classmethod
    def validar_nombre(cls, v):
        if not v.strip():
            raise ValueError("El nombre no puede estar vacío")
        return v.strip().title()  # "luis miranda" → "Luis Miranda"


# Para crear un cliente
class ClientCreate(ClientBase):
    pass


# Para actualizar un cliente (todos opcionales)
class ClientUpdate(BaseModel):
    nombre_completo: Optional[str] = Field(None, min_length=3, max_length=100)
    telefono: Optional[str] = Field(None, min_length=7, max_length=20)
    email: Optional[EmailStr] = None
    direccion: Optional[str] = Field(None, max_length=200)
    es_extranjero: Optional[bool] = None
    pais: Optional[str] = Field(None, max_length=50)
    activo: Optional[bool] = None


# Lo que devuelve la API
class ClientResponse(ClientBase):
    id: int
    activo: bool
    creado_en: datetime
    actualizado_en: Optional[datetime] = None

    model_config = {"from_attributes": True}