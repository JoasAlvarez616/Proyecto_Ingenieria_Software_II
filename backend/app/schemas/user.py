from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    nombre_completo: str = Field(..., min_length=2, max_length=100)
    rol: str = Field(default="recepcionista")  # admin, recepcionista
    activo: bool = Field(default=True)

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    nombre_completo: Optional[str] = Field(None, min_length=2, max_length=100)
    rol: Optional[str] = None
    activo: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6)

class UserResponse(UserBase):
    id: int
    creado_en: datetime
    ultimo_acceso: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

class TokenData(BaseModel):
    username: Optional[str] = None
    rol: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserProfileUpdate(BaseModel):
    nombre_completo: str = Field(..., min_length=2, max_length=100)

class UserPasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6)
