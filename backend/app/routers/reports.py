from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from app.database import get_db
from app.models.reservation import Reservation
from app.models.payment import Payment
from app.models.room import Room
from app.models.client import Client
from datetime import date, datetime
from typing import Optional

router = APIRouter(prefix="/reports", tags=["Reportes"])


# ── Reporte general de ingresos ───────────────────────────────
@router.get("/ingresos")
async def reporte_ingresos(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    # Si no se especifica período, usar el mes actual
    if not fecha_inicio:
        hoy = date.today()
        fecha_inicio = hoy.replace(day=1)
    if not fecha_fin:
        fecha_fin = date.today()

    if fecha_inicio > fecha_fin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha de inicio no puede ser mayor a la fecha fin"
        )

    # ── Filtro base de reservas en el período ──
    reservas_periodo = db.query(Reservation).filter(
        and_(
            Reservation.fecha_entrada >= fecha_inicio,
            Reservation.fecha_entrada <= fecha_fin
        )
    ).all()

    # ── Filtro de pagos en el período ──
    pagos_periodo = db.query(Payment).filter(
        and_(
            func.date(Payment.fecha_pago) >= fecha_inicio,
            func.date(Payment.fecha_pago) <= fecha_fin
        )
    ).all()

    # ── Calcular estadísticas de reservas ──
    total_reservas = len(reservas_periodo)
    reservas_completadas = len([r for r in reservas_periodo if r.estado == "completada"])
    reservas_confirmadas = len([r for r in reservas_periodo if r.estado == "confirmada"])
    reservas_canceladas = len([r for r in reservas_periodo if r.estado == "cancelada"])
    reservas_pendientes = len([r for r in reservas_periodo if r.estado == "pendiente"])
    reservas_en_curso = len([r for r in reservas_periodo if r.estado == "en_curso"])

    # ── Calcular ingresos ──
    ingresos_totales = sum(
        p.monto for p in pagos_periodo
        if p.tipo_pago != "devolucion"
    )
    total_devoluciones = sum(
        p.monto for p in pagos_periodo
        if p.tipo_pago == "devolucion"
    )
    ingresos_netos = round(ingresos_totales - total_devoluciones, 2)

    # ── Ingresos por método de pago ──
    ingresos_efectivo = sum(
        p.monto for p in pagos_periodo
        if p.metodo_pago == "efectivo" and p.tipo_pago != "devolucion"
    )
    ingresos_tarjeta = sum(
        p.monto for p in pagos_periodo
        if p.metodo_pago == "tarjeta" and p.tipo_pago != "devolucion"
    )
    ingresos_transferencia = sum(
        p.monto for p in pagos_periodo
        if p.metodo_pago == "transferencia" and p.tipo_pago != "devolucion"
    )

    # ── Ingresos por tipo de habitación ──
    ingresos_por_tipo = {}
    for reserva in reservas_periodo:
        habitacion = db.query(Room).filter(Room.id == reserva.habitacion_id).first()
        if habitacion:
            tipo = habitacion.tipo
            if tipo not in ingresos_por_tipo:
                ingresos_por_tipo[tipo] = {
                    "tipo": tipo,
                    "total_reservas": 0,
                    "ingresos": 0.0
                }
            ingresos_por_tipo[tipo]["total_reservas"] += 1
            ingresos_por_tipo[tipo]["ingresos"] += reserva.monto_pagado

    # ── Estadísticas generales del sistema ──
    total_habitaciones = db.query(Room).filter(Room.activa == True).count()
    total_clientes = db.query(Client).filter(Client.activo == True).count()

    # ── Promedio de noches por reserva ──
    promedio_noches = 0
    if total_reservas > 0:
        promedio_noches = round(
            sum(r.numero_noches for r in reservas_periodo) / total_reservas, 1
        )

    # ── Construir respuesta ──
    return {
        "periodo": {
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin,
        },
        "resumen_ingresos": {
            "ingresos_brutos": round(ingresos_totales, 2),
            "total_devoluciones": round(total_devoluciones, 2),
            "ingresos_netos": ingresos_netos,
        },
        "ingresos_por_metodo_pago": {
            "efectivo": round(ingresos_efectivo, 2),
            "tarjeta": round(ingresos_tarjeta, 2),
            "transferencia": round(ingresos_transferencia, 2),
        },
        "ingresos_por_tipo_habitacion": list(ingresos_por_tipo.values()),
        "resumen_reservas": {
            "total": total_reservas,
            "completadas": reservas_completadas,
            "en_curso": reservas_en_curso,
            "confirmadas": reservas_confirmadas,
            "pendientes": reservas_pendientes,
            "canceladas": reservas_canceladas,
        },
        "estadisticas": {
            "total_pagos_registrados": len(pagos_periodo),
            "promedio_noches_por_reserva": promedio_noches,
            "total_habitaciones_activas": total_habitaciones,
            "total_clientes_activos": total_clientes,
        }
    }


# ── Reporte de ocupación por habitación ──────────────────────
@router.get("/ocupacion")
async def reporte_ocupacion(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db)
):
    if not fecha_inicio:
        hoy = date.today()
        fecha_inicio = hoy.replace(day=1)
    if not fecha_fin:
        fecha_fin = date.today()

    habitaciones = db.query(Room).filter(Room.activa == True).all()
    reporte = []

    for habitacion in habitaciones:
        reservas = db.query(Reservation).filter(
            Reservation.habitacion_id == habitacion.id,
            Reservation.fecha_entrada >= fecha_inicio,
            Reservation.fecha_entrada <= fecha_fin,
            Reservation.estado.in_(["confirmada", "en_curso", "completada"])
        ).all()

        noches_ocupadas = sum(r.numero_noches for r in reservas)
        ingresos = sum(r.monto_pagado for r in reservas)
        dias_periodo = (fecha_fin - fecha_inicio).days or 1
        tasa_ocupacion = round((noches_ocupadas / dias_periodo) * 100, 1)

        reporte.append({
            "habitacion_id": habitacion.id,
            "numero": habitacion.numero,
            "tipo": habitacion.tipo,
            "precio_base": habitacion.precio_base,
            "total_reservas": len(reservas),
            "noches_ocupadas": noches_ocupadas,
            "tasa_ocupacion": f"{tasa_ocupacion}%",
            "ingresos_generados": round(ingresos, 2)
        })

    # Ordenar por ingresos generados de mayor a menor
    reporte.sort(key=lambda x: x["ingresos_generados"], reverse=True)

    return {
        "periodo": {
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin
        },
        "ocupacion_por_habitacion": reporte
    }