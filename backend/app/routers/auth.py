from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserLogin, UserResponse, Token
from app.utils.security import (
    verify_password,
    create_access_token,
    get_current_user
)
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario está inactivo"
        )
        
    # Actualizar fecha de último acceso
    user.ultimo_acceso = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    # Crear token
    access_token = create_access_token(data={"sub": user.username, "rol": user.rol})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

# También agregamos login por formulario (OAuth2PasswordRequestForm) para compatibilidad con Swagger
@router.post("/login/swagger", include_in_schema=False)
async def login_swagger(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.activo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario está inactivo"
        )
        
    user.ultimo_acceso = datetime.utcnow()
    db.commit()
    
    access_token = create_access_token(data={"sub": user.username, "rol": user.rol})
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
