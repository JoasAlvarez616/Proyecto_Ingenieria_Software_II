from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientUpdate, ClientResponse
from typing import Optional

router = APIRouter(prefix="/clients", tags=["Clientes"])


# Obtener todos los clientes
@router.get("/", response_model=list[ClientResponse])
async def get_clients(
    solo_activos: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(Client)
    if solo_activos:
        query = query.filter(Client.activo == True)
    return query.all()


# Buscar cliente por número de documento
@router.get("/buscar/{numero_documento}", response_model=ClientResponse)
async def buscar_cliente(numero_documento: str, db: Session = Depends(get_db)):
    cliente = db.query(Client).filter(
        Client.numero_documento == numero_documento
    ).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente con documento {numero_documento} no encontrado"
        )
    return cliente


# Obtener un cliente por ID
@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(client_id: int, db: Session = Depends(get_db)):
    cliente = db.query(Client).filter(Client.id == client_id).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente con ID {client_id} no encontrado"
        )
    return cliente


# Crear un cliente
@router.post("/", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(client_data: ClientCreate, db: Session = Depends(get_db)):
    # Verificar que el documento no exista
    existe = db.query(Client).filter(
        Client.numero_documento == client_data.numero_documento
    ).first()
    if existe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un cliente con el documento {client_data.numero_documento}"
        )
    nuevo_cliente = Client(**client_data.model_dump())
    db.add(nuevo_cliente)
    db.commit()
    db.refresh(nuevo_cliente)
    return nuevo_cliente


# Actualizar un cliente
@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(client_id: int, client_data: ClientUpdate, db: Session = Depends(get_db)):
    cliente = db.query(Client).filter(Client.id == client_id).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente con ID {client_id} no encontrado"
        )
    datos = client_data.model_dump(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(cliente, campo, valor)
    db.commit()
    db.refresh(cliente)
    return cliente


# Eliminar (soft delete) un cliente
@router.delete("/{client_id}", status_code=status.HTTP_200_OK)
async def delete_client(client_id: int, db: Session = Depends(get_db)):
    cliente = db.query(Client).filter(Client.id == client_id).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente con ID {client_id} no encontrado"
        )
    cliente.activo = False
    db.commit()
    return {"mensaje": f"Cliente {cliente.nombre_completo} desactivado correctamente"}


#Reactivar un cliente
@router.patch("/{client_id}/reactivar", response_model=ClientResponse)
async def reactivate_client(client_id: int, db: Session = Depends(get_db)):
    """Reactivar un cliente previamente desactivado (soft delete)."""
    cliente = db.query(Client).filter(Client.id == client_id).first()
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado"
        )
    
    cliente.activo = True
    db.commit()
    db.refresh(cliente)
    return cliente