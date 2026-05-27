from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.database import get_db
from app.models.room import Room
from app.models.client import Client
from app.models.reservation import Reservation
from app.schemas.reservation import (
    ReservationCreate, ReservationUpdate,
    ReservationResponse, ReservationSummary
)
from datetime import date, datetime
from typing import Optional

router = APIRouter(prefix="/reservations", tags=["Reservas"])


# ── Función auxiliar ──────────────────────────────────────────
def verificar_disponibilidad(
    db: Session,
    habitacion_id: int,
    fecha_entrada: date,
    fecha_salida: date,
    excluir_reserva_id: Optional[int] = None
) -> bool:
    """Verifica si una habitación está disponible en un rango de fechas."""
    query = db.query(Reservation).filter(
        Reservation.habitacion_id == habitacion_id,
        Reservation.estado.in_(["pendiente", "confirmada", "en_curso"]),
        # Detectar solapamiento de fechas
        and_(
            Reservation.fecha_entrada < fecha_salida,
            Reservation.fecha_salida > fecha_entrada
        )
    )
    if excluir_reserva_id:
        query = query.filter(Reservation.id != excluir_reserva_id)

    return query.first() is None  # True = disponible


# ── Endpoints ─────────────────────────────────────────────────

# Obtener todas las reservas
@router.get("/", response_model=list[ReservationSummary])
async def get_reservations(
    estado: Optional[str] = None,
    cliente_id: Optional[int] = None,
    habitacion_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Reservation)
    if estado:
        query = query.filter(Reservation.estado == estado.lower())
    if cliente_id:
        query = query.filter(Reservation.cliente_id == cliente_id)
    if habitacion_id:
        query = query.filter(Reservation.habitacion_id == habitacion_id)
    return query.order_by(Reservation.fecha_entrada.desc()).all()


# Obtener una reserva por ID
@router.get("/{reservation_id}", response_model=ReservationResponse)
async def get_reservation(reservation_id: int, db: Session = Depends(get_db)):
    reserva = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reserva con ID {reservation_id} no encontrada"
        )
    return reserva


# Verificar disponibilidad de habitación
@router.get("/disponibilidad/{habitacion_id}", tags=["Reservas"])
async def check_disponibilidad(
    habitacion_id: int,
    fecha_entrada: date,
    fecha_salida: date,
    db: Session = Depends(get_db)
):
    habitacion = db.query(Room).filter(
        Room.id == habitacion_id,
        Room.activa == True
    ).first()
    if not habitacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Habitación con ID {habitacion_id} no encontrada"
        )

    disponible = verificar_disponibilidad(db, habitacion_id, fecha_entrada, fecha_salida)
    noches = (fecha_salida - fecha_entrada).days
    costo_estimado = noches * habitacion.precio_base

    return {
        "habitacion_id": habitacion_id,
        "numero": habitacion.numero,
        "tipo": habitacion.tipo,
        "disponible": disponible,
        "fecha_entrada": fecha_entrada,
        "fecha_salida": fecha_salida,
        "numero_noches": noches,
        "precio_por_noche": habitacion.precio_base,
        "costo_estimado": costo_estimado
    }


# Crear una reserva
@router.post("/", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
async def create_reservation(reserva_data: ReservationCreate, db: Session = Depends(get_db)):
    # 1. Verificar que la habitación existe y está activa
    habitacion = db.query(Room).filter(
        Room.id == reserva_data.habitacion_id,
        Room.activa == True
    ).first()
    if not habitacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Habitación con ID {reserva_data.habitacion_id} no encontrada"
        )

    # 2. Verificar capacidad
    if reserva_data.numero_huespedes > habitacion.capacidad:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"La habitación tiene capacidad máxima de {habitacion.capacidad} personas"
        )

    # 3. Verificar que el cliente existe y está activo
    cliente = db.query(Client).filter(
        Client.id == reserva_data.cliente_id,
        Client.activo == True
    ).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente con ID {reserva_data.cliente_id} no encontrado"
        )

    # 4. Verificar disponibilidad
    disponible = verificar_disponibilidad(
        db,
        reserva_data.habitacion_id,
        reserva_data.fecha_entrada,
        reserva_data.fecha_salida
    )
    if not disponible:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La habitación no está disponible en las fechas seleccionadas"
        )

    # 5. Calcular valores automáticamente
    numero_noches = (reserva_data.fecha_salida - reserva_data.fecha_entrada).days
    precio_por_noche = habitacion.precio_base
    costo_total = numero_noches * precio_por_noche

    # 6. Crear la reserva
    nueva_reserva = Reservation(
        **reserva_data.model_dump(),
        numero_noches=numero_noches,
        precio_por_noche=precio_por_noche,
        costo_total=costo_total,
        monto_pagado=0.0,
        estado="pendiente"
    )
    db.add(nueva_reserva)
    db.commit()
    db.refresh(nueva_reserva)
    return nueva_reserva


# Actualizar una reserva
@router.put("/{reservation_id}", response_model=ReservationResponse)
async def update_reservation(
    reservation_id: int,
    reserva_data: ReservationUpdate,
    db: Session = Depends(get_db)
):
    reserva = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reserva con ID {reservation_id} no encontrada"
        )

    # No se puede modificar una reserva cancelada o completada
    if reserva.estado in ["cancelada", "completada"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede modificar una reserva en estado '{reserva.estado}'"
        )

    datos = reserva_data.model_dump(exclude_unset=True)

    # Si cambian las fechas, recalcular costos y verificar disponibilidad
    nueva_entrada = datos.get("fecha_entrada", reserva.fecha_entrada)
    nueva_salida = datos.get("fecha_salida", reserva.fecha_salida)

    if "fecha_entrada" in datos or "fecha_salida" in datos:
        disponible = verificar_disponibilidad(
            db, reserva.habitacion_id,
            nueva_entrada, nueva_salida,
            excluir_reserva_id=reservation_id
        )
        if not disponible:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La habitación no está disponible en las nuevas fechas"
            )
        # Recalcular
        datos["numero_noches"] = (nueva_salida - nueva_entrada).days
        datos["costo_total"] = datos["numero_noches"] * reserva.precio_por_noche

    for campo, valor in datos.items():
        setattr(reserva, campo, valor)

    db.commit()
    db.refresh(reserva)
    return reserva


# Cancelar una reserva
@router.patch("/{reservation_id}/cancelar", response_model=ReservationResponse)
async def cancel_reservation(reservation_id: int, db: Session = Depends(get_db)):
    reserva = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reserva con ID {reservation_id} no encontrada"
        )

    if reserva.estado not in ["pendiente", "confirmada"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se puede cancelar una reserva en estado '{reserva.estado}'"
        )

    reserva.estado = "cancelada"
    reserva.cancelado_en = datetime.now()
    db.commit()
    db.refresh(reserva)
    return reserva

