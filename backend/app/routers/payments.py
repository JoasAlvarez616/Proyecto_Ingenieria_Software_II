from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.payment import Payment
from app.models.reservation import Reservation
from app.schemas.payment import (
    PaymentCreate, PaymentUpdate,
    PaymentResponse, ReservationPaymentStatus
)

router = APIRouter(prefix="/payments", tags=["Pagos"])

from app.schemas.pagination import PaginatedResponse
import math

# Obtener todos los pagos
@router.get("/", response_model=PaginatedResponse[PaymentResponse])
async def get_all_payments(
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    query = db.query(Payment)
    
    total = query.count()
    total_pages = math.ceil(total / limit) if limit > 0 else 0
    
    skip = (page - 1) * limit
    data = query.order_by(Payment.fecha_pago.desc()).offset(skip).limit(limit).all()
    
    return {
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }


# Obtener todos los pagos de una reserva
@router.get("/reserva/{reserva_id}", response_model=ReservationPaymentStatus)
async def get_payments_by_reservation(reserva_id: int, db: Session = Depends(get_db)):
    reserva = db.query(Reservation).filter(Reservation.id == reserva_id).first()
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reserva con ID {reserva_id} no encontrada"
        )

    pagos = db.query(Payment).filter(Payment.reserva_id == reserva_id).all()

    return {
        "reserva_id": reserva_id,
        "costo_total": reserva.costo_total,
        "monto_pagado": reserva.monto_pagado,
        "saldo_pendiente": round(reserva.costo_total - reserva.monto_pagado, 2),
        "esta_pagado": reserva.monto_pagado >= reserva.costo_total,
        "pagos": pagos
    }


# Obtener un pago por ID
@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: int, db: Session = Depends(get_db)):
    pago = db.query(Payment).filter(Payment.id == payment_id).first()
    if not pago:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pago con ID {payment_id} no encontrado"
        )
    return pago


# Registrar un pago
@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(pago_data: PaymentCreate, db: Session = Depends(get_db)):
    # 1. Verificar que la reserva existe
    reserva = db.query(Reservation).filter(
        Reservation.id == pago_data.reserva_id
    ).first()
    if not reserva:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reserva con ID {pago_data.reserva_id} no encontrada"
        )

    # 2. No permitir pagos a reservas canceladas o completadas
    if reserva.estado in ["cancelada", "completada"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No se pueden registrar pagos en una reserva '{reserva.estado}'"
        )

    # 3. Verificar que el pago no exceda el saldo pendiente
    saldo_pendiente = reserva.costo_total - reserva.monto_pagado
    if pago_data.tipo_pago != "devolucion" and pago_data.monto > saldo_pendiente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El monto excede el saldo pendiente de ${saldo_pendiente:.2f}"
        )

    # 4. Registrar el pago
    nuevo_pago = Payment(**pago_data.model_dump())
    db.add(nuevo_pago)

    # 5. Actualizar monto_pagado en la reserva
    if pago_data.tipo_pago == "devolucion":
        reserva.monto_pagado = round(reserva.monto_pagado - pago_data.monto, 2)
    else:
        reserva.monto_pagado = round(reserva.monto_pagado + pago_data.monto, 2)

    # 6. Si el pago es un adelanto, confirmar la reserva automáticamente
    if pago_data.tipo_pago == "adelanto" and reserva.estado == "pendiente":
        reserva.estado = "confirmada"

    # 7. Si está completamente pagado, marcar como confirmada (si no lo estaba)
    if reserva.monto_pagado >= reserva.costo_total and reserva.estado == "pendiente":
        reserva.estado = "confirmada"

    db.commit()
    db.refresh(nuevo_pago)
    return nuevo_pago


# Actualizar datos administrativos de un pago
@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: int,
    pago_data: PaymentUpdate,
    db: Session = Depends(get_db)
):
    pago = db.query(Payment).filter(Payment.id == payment_id).first()
    if not pago:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pago con ID {payment_id} no encontrado"
        )

    datos = pago_data.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(pago, campo, valor)

    db.commit()
    db.refresh(pago)
    return pago