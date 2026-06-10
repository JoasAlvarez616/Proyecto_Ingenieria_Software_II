---
title: "Sistema de Gestión Hotelera"
subtitle: "Manual Técnico"
author: "Luis Miranda | Aníbal Silva | Jesús López | Joás Álvarez"
date: "10 de junio de 2026"
---

# MANUAL TÉCNICO

## ⚠️ AUDIENCIA

Este manual está dirigido a **desarrolladores y personal técnico** que necesiten mantener, modificar o escalar el sistema.

---

## 1. ARQUITECTURA GENERAL

El sistema tiene tres capas:

| Capa | Tecnología | Puerto |
|------|------------|--------|
| Cliente (Frontend) | React + TypeScript | 5173 |
| Servidor (Backend) | FastAPI + Python | 8000 |
| Base de datos | SQLite | - |

### Flujo de comunicación

1. El usuario abre el navegador en http://localhost:5173
2. El Frontend envía una petición al Backend
3. El Backend consulta la Base de Datos
4. La Base de Datos devuelve los datos al Backend
5. El Backend responde al Frontend con datos en formato JSON
6. El Frontend actualiza la pantalla del usuario

### Ejemplo de comunicación

| Dirección | Tipo | Qué viaja |
|-----------|------|-----------|
| Frontend hacia Backend | Petición HTTP | GET /rooms/ |
| Backend hacia Base de Datos | SQL | SELECT * FROM rooms |
| Base de Datos hacia Backend | Datos | Lista de habitaciones |
| Backend hacia Frontend | JSON | [{"id":1, "numero":"101"}] |

---

## 2. TECNOLOGÍAS UTILIZADAS

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Python | 3.10+ | Lenguaje principal |
| FastAPI | 0.136.1 | Framework web |
| SQLAlchemy | 2.0.49 | ORM para base de datos |
| SQLite | - | Motor de base de datos |
| Uvicorn | 0.34.0 | Servidor ASGI |
| python-jose | 3.5.0 | JWT para autenticación |
| passlib | 1.7.4 | Encriptación de contraseñas |

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | 19 | Biblioteca de UI |
| TypeScript | 5.x | Tipado estático |
| Vite | 8.x | Empaquetador y servidor |
| TailwindCSS | 3.4.19 | Estilos |
| React Router | 7.x | Navegación SPA |
| Axios | - | Cliente HTTP |
| Recharts | - | Gráficos en reportes |

---

## 3. ESTRUCTURA DE CARPETAS

### Backend

- backend/
  - app/
    - models/
      - room.py
      - client.py
      - reservation.py
      - payment.py
      - user.py
    - routers/
      - rooms.py
      - clients.py
      - reservations.py
      - payments.py
      - reports.py
    - schemas/
      - room.py
      - client.py
      - reservation.py
      - payment.py
    - utils/
      - security.py
    - database.py
    - main.py
  - database/
    - hotel.db
  - venv/
  - requirements.txt
  - run.py

### Frontend

- frontend/
  - src/
    - components/
      - Layout.tsx
      - PrivateRoute.tsx
      - Modal.tsx
    - pages/
      - Dashboard.tsx
      - Login.tsx
      - Rooms.tsx
      - Clients.tsx
      - Reservations.tsx
      - Payments.tsx
      - Reports.tsx
      - Settings.tsx
      - Profile.tsx
    - services/
      - api.ts
      - auth.ts
    - styles/
      - variables.css
    - utils/
      - formatters.ts
    - App.tsx
    - main.tsx
  - package.json
  - vite.config.ts

---

## 4. BASE DE DATOS

### Tablas del sistema

| Tabla | Descripción |
|-------|-------------|
| rooms | Habitaciones del hotel |
| clients | Clientes registrados |
| reservations | Reservas realizadas |
| payments | Pagos registrados |
| users | Usuarios del sistema |

### Tabla rooms (habitaciones)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | Clave primaria |
| numero | VARCHAR(10) | Número de habitación |
| tipo | VARCHAR(50) | simple/doble/triple/suite |
| capacidad | INTEGER | Máximo de personas |
| precio_base | FLOAT | Precio por noche |
| estado | VARCHAR(20) | disponible/ocupada/mantenimiento |
| activa | BOOLEAN | Soft delete |
| creado_en | DATETIME | Timestamp |
| actualizado_en | DATETIME | Timestamp |

### Tabla clients (clientes)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | Clave primaria |
| nombre_completo | VARCHAR(100) | Nombre del cliente |
| tipo_documento | VARCHAR(20) | cedula/pasaporte |
| numero_documento | VARCHAR(30) | Único, indexado |
| telefono | VARCHAR(20) | Contacto |
| email | VARCHAR(100) | Opcional |
| direccion | VARCHAR(200) | Opcional |
| activo | BOOLEAN | Soft delete |
| es_extranjero | BOOLEAN | Default false |
| pais | VARCHAR(50) | Default 'Colombia' |
| creado_en | DATETIME | Timestamp |
| actualizado_en | DATETIME | Timestamp |

### Tabla reservations (reservas)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | Clave primaria |
| habitacion_id | INTEGER | Llave foránea hacia rooms |
| cliente_id | INTEGER | Llave foránea hacia clients |
| fecha_entrada | DATE | Check-in |
| fecha_salida | DATE | Check-out |
| numero_huespedes | INTEGER | Cantidad de personas |
| numero_noches | INTEGER | Calculado automáticamente |
| precio_por_noche | FLOAT | Snapshot del precio |
| costo_total | FLOAT | Calculado automáticamente |
| monto_pagado | FLOAT | Suma de pagos |
| estado | VARCHAR(20) | pendiente/confirmada/en_curso/completada/cancelada |
| observaciones | VARCHAR(500) | Notas adicionales |
| creado_en | DATETIME | Timestamp |
| actualizado_en | DATETIME | Timestamp |
| cancelado_en | DATETIME | Timestamp de cancelación |

### Tabla payments (pagos)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | Clave primaria |
| reserva_id | INTEGER | Llave foránea hacia reservations |
| monto | FLOAT | Monto pagado |
| metodo_pago | VARCHAR(20) | efectivo/tarjeta/transferencia |
| tipo_pago | VARCHAR(20) | adelanto/pago_parcial/pago_total/devolucion |
| referencia | VARCHAR(100) | Comprobante opcional |
| observaciones | VARCHAR(500) | Notas adicionales |
| fecha_pago | DATETIME | Fecha del pago |
| creado_en | DATETIME | Timestamp |

### Tabla users (usuarios)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER | Clave primaria |
| username | VARCHAR(50) | Nombre de usuario único |
| password_hash | VARCHAR(255) | Hash bcrypt |
| nombre_completo | VARCHAR(100) | Nombre del usuario |
| rol | VARCHAR(20) | admin / recepcionista |
| activo | BOOLEAN | Estado del usuario |
| creado_en | DATETIME | Timestamp |
| ultimo_acceso | DATETIME | Último inicio de sesión |

---

## 5. ENDPOINTS DE LA API

### Habitaciones (rooms)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /rooms/ | Listar habitaciones |
| GET | /rooms/{id} | Obtener una habitación |
| POST | /rooms/ | Crear habitación |
| PUT | /rooms/{id} | Actualizar habitación |
| DELETE | /rooms/{id} | Soft delete |

### Clientes (clients)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /clients/ | Listar clientes |
| GET | /clients/{id} | Obtener un cliente |
| GET | /clients/buscar/{documento} | Buscar por documento |
| POST | /clients/ | Crear cliente |
| PUT | /clients/{id} | Actualizar cliente |
| DELETE | /clients/{id} | Soft delete |
| PATCH | /clients/{id}/reactivar | Reactivar cliente |

### Reservas (reservations)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /reservations/ | Listar reservas |
| GET | /reservations/{id} | Obtener una reserva |
| GET | /reservations/disponibilidad/{id} | Verificar disponibilidad |
| POST | /reservations/ | Crear reserva |
| PUT | /reservations/{id} | Actualizar reserva |
| PATCH | /reservations/{id}/cancelar | Cancelar reserva |

### Pagos (payments)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /payments/reserva/{id} | Pagos de una reserva |
| GET | /payments/{id} | Obtener un pago |
| POST | /payments/ | Registrar pago |
| PUT | /payments/{id} | Actualizar pago |

### Reportes (reports)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /reports/ingresos | Reporte de ingresos por período |
| GET | /reports/ocupacion | Reporte de ocupación por habitación |

---

## 6. LÓGICA DE NEGOCIO CLAVE

### Verificación de disponibilidad

Una habitación NO está disponible si existe una reserva activa (pendiente, confirmada o en curso) cuyas fechas se solapan con el período solicitado.

Condición de solapamiento:
- La fecha de entrada existente es MENOR que la nueva fecha de salida
- La fecha de salida existente es MAYOR que la nueva fecha de entrada

### Cálculo automático de costos

| Campo | Fórmula |
|-------|---------|
| numero_noches | fecha_salida - fecha_entrada |
| precio_por_noche | habitacion.precio_base (snapshot) |
| costo_total | numero_noches x precio_por_noche |

### Ciclo de vida de reserva

| Estado | Descripción | Transiciones permitidas |
|--------|-------------|------------------------|
| pendiente | Reserva creada, sin pago | confirmada, cancelada |
| confirmada | Reserva con adelanto pagado | en_curso, cancelada |
| en_curso | Check-in realizado | completada |
| completada | Check-out realizado | Ninguna (estado final) |
| cancelada | Reserva anulada | Ninguna (estado final) |

### Lógica de pagos

| Regla | Descripción |
|-------|-------------|
| Adelanto confirma reserva | Si el primer pago es tipo 'adelanto', reserva pasa a confirmada |
| Límite de monto | Ningún pago puede exceder el saldo pendiente |
| Sin pagos a canceladas | No se permiten pagos a reservas canceladas o completadas |
| Devoluciones | El tipo 'devolucion' resta del monto_pagado |

### Soft delete (eliminación lógica)

Los registros no se eliminan físicamente de la base de datos. Se marca un campo booleano:
- activo = false para clientes
- activa = false para habitaciones

Esto permite conservar el historial completo y reactivar registros si es necesario.

---

## 7. AUTENTICACIÓN Y SEGURIDAD

### JWT (JSON Web Tokens)

| Elemento | Descripción |
|----------|-------------|
| Generación | Al iniciar sesión, el backend crea un token |
| Envío | Se envía en cada petición en el header |
| Header | Authorization: Bearer token |
| Expiración | El token expira después de un tiempo configurado |

### Encriptación de contraseñas

| Tecnología | Propósito |
|------------|-----------|
| passlib[bcrypt] | Hash de contraseñas |
| Característica | Las contraseñas nunca se almacenan en texto plano |

### Roles y permisos

| Rol | Permisos |
|-----|----------|
| admin | Acceso total (reportes, configuración, usuarios, todo) |
| recepcionista | Reservas, clientes, pagos, consultas |

---

## 8. COMPONENTES DEL FRONTEND

### Pantallas principales

| Componente | Ruta | Descripción |
|------------|------|-------------|
| Dashboard | / | Pantalla principal con indicadores |
| Rooms | /rooms | Gestión de habitaciones |
| Clients | /clients | Gestión de clientes |
| Reservations | /reservations | Listado y creación de reservas |
| Payments | /payments | Historial de pagos |
| Reports | /reports | Reportes de ingresos y ocupación |
| Settings | /settings | Configuración (solo admin) |
| Profile | /profile | Cambio de contraseña |
| Login | /login | Pantalla de autenticación |

### Rutas protegidas

| Componente | Función |
|------------|---------|
| PrivateRoute | Verifica que el usuario esté autenticado |
| RoleRoute | Verifica el rol del usuario (ej. solo admin) |

---

## 9. MANTENIMIENTO FUTURO

### Agregar una nueva columna a la base de datos

1. Crear script Python:

import sqlite3
conn = sqlite3.connect("database/hotel.db")
cursor = conn.cursor()
cursor.execute("ALTER TABLE clients ADD COLUMN nueva_columna VARCHAR(100)")
conn.commit()
conn.close()

2. Ejecutar el script
3. Actualizar el modelo SQLAlchemy correspondiente

### Agregar un nuevo endpoint

1. Crear el schema en app/schemas/ (validación de datos)
2. Crear la función en app/routers/ (lógica del endpoint)
3. Registrar el router en app/main.py

### Agregar una nueva pantalla en el frontend

1. Crear el componente en src/pages/
2. Agregar la ruta en App.tsx
3. Agregar el botón en el menú (components/Layout.tsx)
4. Crear el servicio en src/services/ si necesita llamar a la API

---

## 10. POSIBLES MEJORAS FUTURAS

| Mejora | Descripción |
|--------|-------------|
| Facturación electrónica | Generar facturas XML para DIAN |
| Pasarela de pagos | Integrar con Wompi, PayU o MercadoPago |
| Múltiples hoteles | Un solo sistema para varias sedes |
| App móvil | Versión nativa para Android o iOS |
| Notificaciones | Correos o WhatsApp automáticos |
| Dashboard más avanzado | Más gráficos y filtros |
| Modo oscuro | Interfaz con tema oscuro |

---

## 11. REFERENCIAS

| Documentación | Enlace |
|---------------|--------|
| FastAPI | https://fastapi.tiangolo.com |
| SQLAlchemy | https://www.sqlalchemy.org |
| React | https://react.dev |
| TypeScript | https://www.typescriptlang.org |
| Vite | https://vitejs.dev |
| TailwindCSS | https://tailwindcss.com |