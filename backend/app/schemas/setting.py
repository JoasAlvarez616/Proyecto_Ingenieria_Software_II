from pydantic import BaseModel, Field
from typing import Optional

class HotelConfigBase(BaseModel):
    nombre: str = Field(..., max_length=100)
    eslogan: Optional[str] = Field(None, max_length=200)
    ruc: Optional[str] = Field(None, max_length=20)
    telefono: Optional[str] = Field(None, max_length=20)
    direccion: Optional[str] = Field(None, max_length=200)
    email: Optional[str] = Field(None, max_length=100)
    logo_url: Optional[str] = Field(None, max_length=500)

class HotelConfigUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=100)
    eslogan: Optional[str] = Field(None, max_length=200)
    ruc: Optional[str] = Field(None, max_length=20)
    telefono: Optional[str] = Field(None, max_length=20)
    direccion: Optional[str] = Field(None, max_length=200)
    email: Optional[str] = Field(None, max_length=100)
    logo_url: Optional[str] = Field(None, max_length=500)

class HotelConfigResponse(HotelConfigBase):
    id: int

    class Config:
        from_attributes = True
