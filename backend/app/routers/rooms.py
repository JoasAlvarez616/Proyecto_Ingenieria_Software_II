from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.room import Room
from app.schemas.room import RoomCreate, RoomUpdate, RoomResponse
from typing import Optional

router = APIRouter(prefix="/rooms", tags=["Habitaciones"])


from app.schemas.pagination import PaginatedResponse
import math
from sqlalchemy import or_

# Obtener todas las habitaciones
@router.get("/", response_model=PaginatedResponse[RoomResponse])
async def get_rooms(
    tipo: Optional[str] = None,
    estado: Optional[str] = None,
    solo_activas: bool = True,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Room)
    if solo_activas:
        query = query.filter(Room.activa == True)
    if tipo:
        query = query.filter(Room.tipo == tipo.lower())
    if estado:
        query = query.filter(Room.estado == estado.lower())
        
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Room.numero.ilike(search_term),
                Room.tipo.ilike(search_term)
            )
        )
        
    total = query.count()
    total_pages = math.ceil(total / limit) if limit > 0 else 0
    
    skip = (page - 1) * limit
    data = query.order_by(Room.numero.asc()).offset(skip).limit(limit).all()
    
    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }


# Obtener una habitación por ID
@router.get("/{room_id}", response_model=RoomResponse)
async def get_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Habitación con ID {room_id} no encontrada"
        )
    return room


# Crear una habitación
@router.post("/", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room(room_data: RoomCreate, db: Session = Depends(get_db)):
    # Verificar que el número no exista
    existe = db.query(Room).filter(Room.numero == room_data.numero).first()
    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe una habitación con el número {room_data.numero}"
        )
    nueva_habitacion = Room(**room_data.model_dump())
    db.add(nueva_habitacion)
    db.commit()
    db.refresh(nueva_habitacion)
    return nueva_habitacion


# Actualizar una habitación
@router.put("/{room_id}", response_model=RoomResponse)
async def update_room(room_id: int, room_data: RoomUpdate, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Habitación con ID {room_id} no encontrada"
        )
    # Actualizar solo los campos enviados
    datos = room_data.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(room, campo, valor)
    db.commit()
    db.refresh(room)
    return room


# Eliminar (soft delete) una habitación
@router.delete("/{room_id}", status_code=status.HTTP_200_OK)
async def delete_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Habitación con ID {room_id} no encontrada"
        )
    room.activa = False
    db.commit()
    return {"mensaje": f"Habitación {room.numero} desactivada correctamente"}