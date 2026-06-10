---
title: "Sistema de Gestión Hotelera"
subtitle: "Manual de Usuario"
author: "Luis Miranda | Aníbal Silva | Jesús López | Joás Álvarez"
date: "10 de junio de 2026"
institution: "Universidad de La Guajira"
course: "Ingeniería de Software II - Semestre I 2026"
professor: "Sara Luz Villero Contreras"
toc: true
toc-depth: 2
numbersections: true
---

# Información del Proyecto

| Campo | Información |
|-------|-------------|
| **Proyecto** | Sistema de Gestión Hotelera |
| **Institución** | Universidad de La Guajira - Sede Maicao |
| **Facultad** | Ingeniería |
| **Materia** | Ingeniería de Software II |
| **Semestre** | I - 2026 |
| **Profesora** | Sara Luz Villero Contreras |
| **Fecha de entrega** | 10 de junio de 2026 |
| **Integrantes** | Luis Miranda, Aníbal Silva, Jesús López, Joás Álvarez |

---

# Introducción

## Contexto del problema

Los hoteles de pequeña y mediana escala en la región de La Guajira enfrentan dificultades operativas debido a la gestión manual de sus procesos. El control de reservas, la disponibilidad de habitaciones, el registro de huéspedes y la administración de pagos se realizan frecuentemente mediante libretas físicas, hojas de cálculo o sistemas desconectados que no permiten una visión centralizada del negocio.

Esta situación genera:
- **Doble reserva** de habitaciones por falta de control en tiempo real
- **Pérdida de información** de clientes frecuentes
- **Dificultad para generar reportes** de ingresos y ocupación
- **Insatisfacción del huésped** por procesos lentos en recepción

## Solución propuesta

El **Sistema de Gestión Hotelera** es una aplicación web diseñada específicamente para hoteles de pequeña y mediana operación. Permite:

- Centralizar la información de habitaciones, clientes, reservas y pagos
- Visualizar la ocupación del hotel en tiempo real mediante un calendario interactivo
- Automatizar el cálculo de costos de estadía
- Generar reportes de ingresos y ocupación para la toma de decisiones
- Registrar pagos parciales y totales con actualización automática de saldos

## Objetivos del manual

Este manual tiene como propósito guiar al personal del hotel (recepcionistas, administradores) en el uso diario del sistema, explicando cada pantalla y funcionalidad de manera clara y sencilla.

---

# Requisitos para usar el sistema

## Requisitos técnicos

| Componente | Requisito |
|------------|-----------|
| Computador | Cualquier PC con Windows, Linux o Mac |
| Navegador | Google Chrome (recomendado), Microsoft Edge o Mozilla Firefox |
| Red | Conexión a la red local donde está instalado el servidor |
| Conocimientos | Manejo básico del navegador y escritura con teclado |

## Credenciales de acceso

El sistema tiene dos usuarios predefinidos:

| Usuario | Contraseña | Rol | Permisos |
|---------|------------|-----|----------|
| **admin** | admin123 | Administrador | Acceso total (reportes, configuración, usuarios) |
| **recepcionista** | hotel123 | Recepcionista | Reservas, clientes, pagos, consultas |

> ⚠️ **Importante:** Cambiar las contraseñas por defecto después del primer inicio por seguridad.

---

# Acceso al Sistema

## Iniciar sesión

**Paso 1:** Abrir el navegador web (Chrome recomendado)

**Paso 2:** En la barra de direcciones, escribir la dirección del sistema:

- Si se usa en la misma computadora del servidor: `http://localhost:5173`
- Si se accede desde otra computadora: `http://[IP_DEL_SERVIDOR]:5173`

**Paso 3:** Ingresar usuario y contraseña

**Paso 4:** Hacer clic en el botón **"Iniciar sesión"**

![Pantalla de login]

## Cerrar sesión

1. Hacer clic en el ícono de usuario en la esquina superior derecha
2. Seleccionar **"Cerrar sesión"**

---

# Pantalla Principal (Dashboard)

Al iniciar sesión correctamente, se muestra el **Panel de Control** o **Dashboard**.

## Indicadores principales

| Indicador | Qué significa |
|-----------|---------------|
| **Habitaciones ocupadas** | Número de habitaciones que actualmente tienen huéspedes |
| **Check-ins hoy** | Cantidad de huéspedes que llegan el día de hoy |
| **Check-outs hoy** | Cantidad de huéspedes que terminan su estadía hoy |
| **Ingresos del mes** | Total de dinero recaudado en el mes actual |

## Secciones adicionales

- **Reservas recientes:** Muestra las últimas 5 reservas creadas. Haciendo clic en "Ver" se abren los detalles.
- **Gráfico de ocupación:** Muestra visualmente el porcentaje de ocupación de los últimos 7 días.

---

# Navegación por el Menú

El menú lateral (o superior en pantallas pequeñas) contiene las siguientes opciones:

| Opción | Descripción |
|--------|-------------|
| 📊 Dashboard | Pantalla principal con resumen del hotel |
| 📅 Calendario | Vista de ocupación por habitación y día |
| 🛏️ Habitaciones | Gestión de habitaciones (ver, editar) |
| 👥 Clientes | Registro y búsqueda de clientes |
| 📝 Reservas | Listado y creación de reservas |
| 💰 Pagos | Historial y registro de pagos |
| 📈 Reportes | Generación de informes de ingresos y ocupación |
| ⚙️ Configuración | Ajustes del sistema (solo administradores) |
| 👤 Perfil | Cambio de contraseña y datos del usuario |

---

# Gestión de Habitaciones

## Ver listado de habitaciones

1. Hacer clic en **"Habitaciones"** en el menú
2. Se muestra una tabla con:

| Campo | Descripción |
|-------|-------------|
| Número | Identificador de la habitación (ej. 101, 102) |
| Tipo | Simple, Doble, Triple o Suite |
| Capacidad | Máximo de personas |
| Precio base | Valor por noche |
| Estado | Disponible, Ocupada o Mantenimiento |

## Editar una habitación

1. Localizar la habitación en la tabla
2. Hacer clic en el ícono ✏️ (editar)
3. Modificar los campos necesarios
4. Hacer clic en **"Guardar"**

## Cambiar estado de una habitación

| Estado | Uso |
|--------|-----|
| **Disponible** | Habitación libre para nuevas reservas |
| **Ocupada** | Habitación con huéspedes actualmente |
| **Mantenimiento** | Habitación fuera de servicio (limpieza profunda, reparaciones) |

---

# Gestión de Clientes

## Registrar un nuevo cliente

**Paso 1:** Ir a **"Clientes"** en el menú

**Paso 2:** Hacer clic en **"Nuevo cliente"**

**Paso 3:** Completar el formulario:

| Campo | Obligatorio | Descripción |
|-------|-------------|-------------|
| Nombre completo | ✅ | Nombres y apellidos del huésped |
| Tipo de documento | ✅ | Cédula o Pasaporte |
| Número de documento | ✅ | Identificación única |
| Teléfono | ✅ | Número de contacto |
| Correo electrónico | ❌ | Opcional |
| Dirección | ❌ | Opcional |

**Paso 4:** Hacer clic en **"Guardar"**

## Buscar un cliente

1. En la pantalla de Clientes, escribir el **número de documento** en el buscador
2. El sistema filtrará los resultados automáticamente
3. Hacer clic en **"Ver"** para mostrar todos los detalles

## Clientes inactivos (desactivados)

Cuando un cliente es "eliminado" del sistema, en realidad se desactiva (soft delete). Si ese cliente regresa al hotel:

1. Buscar por su número de documento
2. El sistema mostrará un mensaje: "Cliente desactivado. ¿Desea reactivarlo?"
3. Hacer clic en **"Aceptar"** para reactivarlo

El cliente volverá a estar activo y podrá hacer nuevas reservas.

---

# Calendario de Ocupación

El **Calendario** es la herramienta más importante del sistema. Permite visualizar rápidamente qué habitaciones están ocupadas en cada fecha.

## Acceder al calendario

Hacer clic en **"Calendario"** en el menú lateral

## Significado de los colores

| Color | Significado | Qué significa para el usuario |
|-------|-------------|-------------------------------|
| 🟢 Verde | Habitación disponible | Se puede reservar |
| 🔵 Azul | Reserva confirmada | Huésped confirmado, esperando llegar |
| 🟡 Amarillo | Reserva pendiente | Falta pago de adelanto |
| 🟠 Naranja | En curso | Huésped ya realizó check-in |
| ⚪ Gris | Día de limpieza | No se puede reservar (limpieza entre salida y entrada) |

## Ver detalles de una reserva

1. Hacer clic en una celda que NO sea verde ni gris
2. Se abrirá una ventana (modal) con:

   - Número de reserva
   - Estado actual
   - Fechas de entrada y salida
   - Costo total
   - Monto pagado
   - Saldo pendiente

## Navegar entre meses

Usar los botones:
- **"← Mes anterior"** para ir al mes previo
- **"Mes siguiente →"** para avanzar al mes siguiente

---

# Crear una Reserva

El sistema guía al usuario a través de **3 pasos** para crear una reserva.

## Paso 1: Cliente

1. Hacer clic en **"Nueva reserva"** en el menú
2. Buscar al cliente por su **número de documento**
3. **Si el cliente existe:** Se mostrarán sus datos
4. **Si el cliente no existe:** Completar el formulario de registro (nombre, documento, teléfono)

> 💡 **Consejo:** Si es un huésped frecuente, créelo una sola vez y luego solo búscalo por su documento.

## Paso 2: Habitación y fechas

1. **Seleccionar habitación:** Hacer clic en la habitación deseada
2. **Seleccionar fecha de entrada** (check-in)
3. **Seleccionar fecha de salida** (check-out)
4. **Indicar número de huéspedes**
5. Hacer clic en **"Verificar disponibilidad"**

Si la habitación está disponible, el sistema avanza al paso 3.

> ⚠️ **Nota:** La fecha de salida debe ser **posterior** a la fecha de entrada. No se permiten reservas en fechas pasadas.

## Paso 3: Pago inicial

1. **Ingresar el monto a pagar** (opcional, puede ser $0)
2. **Seleccionar método de pago:**

| Método | Descripción |
|--------|-------------|
| Efectivo | Pago en efectivo en recepción |
| Tarjeta | Pago con tarjeta débito/crédito |
| Transferencia | Pago por transferencia bancaria |

3. **Seleccionar tipo de pago:**

| Tipo | Efecto |
|------|--------|
| Adelanto | Confirma la reserva inmediatamente |
| Pago parcial | Abona parte del total, la reserva sigue pendiente |
| Pago total | Cancela el 100%, reserva confirmada |

4. Hacer clic en **"Confirmar reserva"**

Al finalizar, el sistema mostrará un mensaje de éxito y redirigirá al Dashboard.

---

# Registrar Pagos

## Desde el Dashboard o Calendario

1. Buscar la reserva y hacer clic en **"Ver"**
2. En la ventana de detalles, hacer clic en **"Registrar pago"**
3. Ingresar:
   - **Monto** a pagar
   - **Método de pago** (efectivo, tarjeta, transferencia)
   - **Tipo de pago** (parcial o total)
4. Hacer clic en **"Confirmar pago"**

## Validaciones automáticas del sistema

| Situación | Qué hace el sistema |
|-----------|---------------------|
| Monto mayor al saldo pendiente | ❌ Rechaza el pago y muestra mensaje de error |
| Adelanto registrado | Cambia reserva de "pendiente" a "confirmada" |
| Pago total completado | Reserva queda pagada, saldo pendiente = $0 |

---

# Reportes

## Generar reporte de ingresos

1. Ir a **"Reportes"** en el menú
2. Por defecto, se muestra el **mes actual**
3. Para cambiar el período:
   - Seleccionar **fecha de inicio**
   - Seleccionar **fecha de fin**
   - Hacer clic en **"Filtrar"**

## Información que muestra el reporte

| Sección | Datos que muestra |
|---------|-------------------|
| Resumen | Ingresos brutos, devoluciones, ingresos netos |
| Por método de pago | Total en efectivo, tarjeta, transferencia |
| Por tipo de habitación | Ingresos por simple, doble, triple, suite |
| Resumen de reservas | Conteo por estado (completadas, confirmadas, canceladas) |

## Exportar a Excel

1. Configurar el período deseado (fechas)
2. Hacer clic en el botón **"Exportar a Excel"**
3. Se descargará un archivo `.xlsx` automáticamente

## Reporte de ocupación

Muestra para **cada habitación**:

- Total de reservas en el período
- Noches ocupadas
- Porcentaje de ocupación
- Ingresos generados

Los resultados se ordenan de mayor a menor por ingresos.

---

# Operaciones del Recepcionista (Check-in / Check-out)

## Realizar check-in

Cuando un huésped llega al hotel:

1. Buscar la reserva en el **Calendario** o en **Reservas**
2. Hacer clic en la reserva (azul o amarilla)
3. En el modal de detalles, seleccionar **"Realizar check-in"**
4. El estado cambiará automáticamente a **"En curso"**

## Realizar check-out

Cuando un huésped se retira:

1. Buscar la reserva en curso (naranja en el calendario)
2. Hacer clic y seleccionar **"Realizar check-out"**
3. Si tiene **saldo pendiente**, el sistema mostrará un mensaje
4. Registrar el pago final antes de completar el check-out

---

# Solución de Problemas Comunes

| Problema | Posible causa | Solución |
|----------|---------------|----------|
| No puedo iniciar sesión | Usuario o contraseña incorrectos | Verificar con el administrador |
| El sistema no carga | El servidor backend no está corriendo | Contactar al administrador técnico |
| Los datos no se actualizan | Caché del navegador | Recargar con F5 o Ctrl+Shift+R |
| Error al crear reserva | Fechas no válidas o habitación ocupada | Verificar disponibilidad en el calendario |
| El calendario no muestra reservas | Filtro de fechas | Cambiar de mes o recargar página |
| No puedo registrar pago | Monto excede el saldo pendiente | Verificar el saldo en los detalles de la reserva |
| El botón "Guardar" no funciona | Campos obligatorios vacíos | Completar todos los campos con * |

---

# Soporte Técnico

Para reportar problemas técnicos o solicitar asistencia:

| Medio | Contacto |
|-------|----------|
| Correo electrónico | [correo_del_equipo@uniguajira.edu.co] |
| Teléfono / WhatsApp | [número de contacto] |
| Horario de atención | Lunes a viernes, 8:00 AM - 6:00 PM |

---

# Glosario de Términos

| Término | Definición |
|---------|------------|
| **Backend** | Servidor del sistema (la "parte invisible" que procesa los datos) |
| **Check-in** | Proceso de ingreso del huésped al hotel |
| **Check-out** | Proceso de salida del huésped del hotel |
| **Dashboard** | Pantalla principal con indicadores resumidos |
| **Frontend** | Interfaz que ve y usa el recepcionista |
| **Soft delete** | Eliminación lógica (el registro se desactiva pero no se borra) |
| **SPA** | Single Page Application - la página no se recarga al navegar |