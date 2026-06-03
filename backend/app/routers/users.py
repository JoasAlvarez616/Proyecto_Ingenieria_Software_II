from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse,
    UserProfileUpdate, UserPasswordChange
)
from app.utils.security import (
    require_role,
    get_current_user,
    hash_password,
    verify_password
)

router = APIRouter(prefix="/users", tags=["Usuarios"])

# --- endpoints de administración (Super Admin) ---

@router.get("/", response_model=list[UserResponse])
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    return db.query(User).all()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    # Verificar si el usuario ya existe
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El nombre de usuario '{user_data.username}' ya está registrado."
        )

    # Crear usuario
    db_user = User(
        username=user_data.username,
        nombre_completo=user_data.nombre_completo,
        rol=user_data.rol,
        activo=user_data.activo,
        password_hash=hash_password(user_data.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # Si se actualiza el username, verificar que no esté ocupado por otro
    if user_data.username and user_data.username != db_user.username:
        existing = db.query(User).filter(User.username == user_data.username).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El nombre de usuario '{user_data.username}' ya está registrado."
            )

    # Actualizar campos
    update_dict = user_data.model_dump(exclude_unset=True)
    if "password" in update_dict:
        password = update_dict.pop("password")
        if password:
            db_user.password_hash = hash_password(password)

    for key, value in update_dict.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    # Prevenir que un admin se elimine a sí mismo
    if db_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puede eliminarse a sí mismo de la base de datos."
        )

    db.delete(db_user)
    db.commit()
    return {"detail": "Usuario eliminado con éxito"}

# --- endpoints de personalización propia (Cualquier usuario logueado) ---

@router.put("/me/profile", response_model=UserResponse)
async def update_my_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.nombre_completo = profile_data.nombre_completo
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/password", status_code=status.HTTP_200_OK)
async def change_my_password(
    password_data: UserPasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verificar contraseña anterior
    if not verify_password(password_data.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña anterior es incorrecta."
        )

    # Actualizar contraseña
    current_user.password_hash = hash_password(password_data.new_password)
    db.commit()
    return {"detail": "Contraseña actualizada con éxito"}
