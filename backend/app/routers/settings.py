import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.setting import HotelConfig
from app.schemas.setting import HotelConfigUpdate, HotelConfigResponse
from app.utils.security import require_role

router = APIRouter(prefix="/settings", tags=["Configuración"])

@router.get("/", response_model=HotelConfigResponse)
async def get_settings(db: Session = Depends(get_db)):
    config = db.query(HotelConfig).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuración del hotel no encontrada"
        )
    return config

@router.put("/", response_model=HotelConfigResponse)
async def update_settings(
    config_data: HotelConfigUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    config = db.query(HotelConfig).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuración del hotel no encontrada"
        )
    
    for key, value in config_data.model_dump(exclude_unset=True).items():
        setattr(config, key, value)
        
    db.commit()
    db.refresh(config)
    return config

@router.post("/logo", response_model=HotelConfigResponse)
async def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    config = db.query(HotelConfig).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuración del hotel no encontrada"
        )
    
    # Validar extensión
    allowed_extensions = [".jpg", ".jpeg", ".png", ".svg", ".webp", ".gif"]
    file_ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Formato de archivo no permitido")
    
    # Generar nombre único
    filename = f"{uuid.uuid4().hex}{file_ext}"
    filepath = os.path.join("static", filename)
    
    # Eliminar logo anterior si existe y es local
    if config.logo_url and config.logo_url.startswith("/static/"):
        old_file = config.logo_url.lstrip("/")
        if os.path.exists(old_file):
            try:
                os.remove(old_file)
            except:
                pass
                
    # Guardar archivo
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    config.logo_url = f"/static/{filename}"
    db.commit()
    db.refresh(config)
    
    return config

@router.delete("/logo", response_model=HotelConfigResponse)
async def delete_logo(
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    config = db.query(HotelConfig).first()
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuración del hotel no encontrada"
        )
        
    # Eliminar logo si existe y es local
    if config.logo_url and config.logo_url.startswith("/static/"):
        old_file = config.logo_url.lstrip("/")
        if os.path.exists(old_file):
            try:
                os.remove(old_file)
            except:
                pass
                
    config.logo_url = ""
    db.commit()
    db.refresh(config)
    
    return config
