---
title: "Sistema de Gestión Hotelera"
subtitle: "Manual de Operación"
author: "Luis Miranda | Aníbal Silva | Jesús López | Joás Álvarez"
date: "10 de junio de 2026"
---

# MANUAL DE OPERACIÓN

## AUDIENCIA

Este manual está dirigido al **administrador del sistema** (dueño del hotel, gerente o personal de TI interno).

---

## 1. RESPALDOS DE BASE DE DATOS

### Ubicación de la base de datos

La base de datos se encuentra en:
backend/database/hotel.db

### Respaldo manual

Pasos para hacer un respaldo manual:

1. Cerrar el sistema (cerrar las ventanas negras)
2. Ir a la carpeta backend/database/
3. Copiar el archivo hotel.db
4. Pegarlo en una carpeta segura (USB, disco externo, nube)

Frecuencia recomendada: Diaria

### Restaurar un respaldo

Pasos para restaurar:

1. Cerrar el sistema
2. Copiar el archivo respaldado
3. Pegarlo en backend/database/hotel.db (reemplazar el existente)
4. Iniciar el sistema nuevamente

---

## 2. RESPALDO AUTOMÁTICO

### Crear archivo de respaldo automático

Crear un archivo llamado respaldar.bat en la carpeta del sistema con este contenido:

@echo off
set BACKUP_DIR=C:\Respaldos_Hotel
set FECHA=%date:~0,2%%date:~3,2%%date:~8,4%
mkdir %BACKUP_DIR% 2>nul
copy backend\database\hotel.db %BACKUP_DIR%\hotel_%FECHA%.db
echo Respaldo completado: hotel_%FECHA%.db
pause

### Programar respaldo automático en Windows

1. Abrir el "Programador de tareas" de Windows
2. Hacer clic en "Crear tarea básica"
3. Nombre: "Respaldo Hotel"
4. Seleccionar frecuencia: Diaria
5. Seleccionar hora: 12:00 AM
6. Acción: Iniciar un programa
7. Programa: respaldar.bat
8. Finalizar

---

## 3. SEGURIDAD

### Usuarios y roles por defecto

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Administrador |
| recepcionista | hotel123 | Recepcionista |

### Cambiar contraseñas

Pasos para cambiar contraseña:

1. Iniciar sesión con el usuario
2. Ir a "Perfil" en el menú lateral
3. Hacer clic en "Cambiar contraseña"
4. Ingresar la nueva contraseña
5. Confirmar la nueva contraseña
6. Guardar cambios

### Recomendaciones de seguridad

| Acción | Por qué |
|--------|---------|
| Cambiar contraseña por defecto | Evita accesos no autorizados |
| No compartir usuarios | Control de quién hace qué en el sistema |
| Respaldar diariamente | No perder información importante |
| Mantener Windows actualizado | Seguridad general del equipo |

---

## 4. GESTIÓN DE USUARIOS

### Crear nuevo usuario (solo administrador)

Pasos:

1. Iniciar sesión como admin
2. Ir a "Configuración" en el menú lateral
3. Hacer clic en "Nuevo usuario"
4. Completar los campos:
   - Nombre de usuario
   - Contraseña
   - Rol (admin o recepcionista)
5. Guardar

### Desactivar usuario

Pasos:

1. En Configuración, buscar el usuario en la lista
2. Hacer clic en "Desactivar"
3. Confirmar la acción

### Roles disponibles

| Rol | Permisos |
|-----|----------|
| admin | Reportes, configuración, gestión de usuarios, acceso total |
| recepcionista | Reservas, clientes, pagos, consultas |

---

## 5. SOLUCIÓN DE PROBLEMAS

### El sistema no inicia

Posibles causas:
- Python o Node.js no están instalados
- El script no se ejecuta como administrador

Soluciones:
1. Verificar que Python esté instalado: abrir terminal y escribir python --version
2. Verificar que Node.js esté instalado: abrir terminal y escribir node --version
3. Ejecutar INICIAR_SISTEMA.bat como administrador (clic derecho -> Ejecutar como administrador)

### Error "puerto 8000 en uso"

Causa: Otro programa está usando el puerto del backend

Solución: Reiniciar la computadora

### Error "puerto 5173 en uso"

Causa: Otro programa está usando el puerto del frontend

Solución: Reiniciar la computadora

### La pantalla se ve sin estilos (letras grandes, sin colores)

Causa: El frontend no cargó correctamente

Solución:
1. Cerrar el navegador
2. Recargar la página con Ctrl + Shift + R

### Error "no such column: clients.es_extranjero"

Causa: La base de datos es de una versión anterior

Solución:
1. Cerrar el sistema
2. Ejecutar python agregar_columnas.py en la carpeta backend
3. Iniciar el sistema nuevamente

### El sistema está lento

Posibles causas:
- Muchas reservas acumuladas
- La computadora tiene poca memoria RAM

Soluciones:
1. Cerrar otras aplicaciones
2. Reiniciar la computadora
3. Archivar reservas antiguas (consultar soporte técnico)

### No se puede iniciar sesión

Causas posibles:
- Usuario o contraseña incorrectos
- El usuario está desactivado

Soluciones:
1. Verificar credenciales con el administrador
2. El administrador puede reactivar usuarios desde Configuración

---

## 6. MANTENIMIENTO PREVENTIVO

### Tareas recomendadas

| Tarea | Frecuencia | Descripción |
|-------|------------|-------------|
| Respaldo de base de datos | Diario | Copiar archivo hotel.db |
| Reinicio del sistema | Semanal | Cerrar y abrir el sistema |
| Limpieza de reservas viejas | Mensual | Archivar reservas de más de 1 año |
| Actualizar contraseñas | Trimestral | Cambiar contraseñas de usuarios |
| Verificar espacio en disco | Mensual | Asegurar que hay espacio para respaldos |

### Limpiar caché del navegador

Si el sistema muestra información desactualizada:

1. Abrir el navegador
2. Presionar Ctrl + Shift + Del
3. Seleccionar "Caché" y "Datos de navegación"
4. Hacer clic en "Borrar datos"

---

## 7. CONTACTOS DE SOPORTE

Para problemas técnicos que no pueda resolver:

| Medio | Contacto |
|-------|----------|
| Correo | equipo@uniguajira.edu.co |
| Teléfono | 300 000 0000 |
| Horario | Lunes a viernes, 8:00 AM - 6:00 PM |

---

## 8. REGISTRO DE INCIDENTES

Mantener un registro de problemas y soluciones:

| Fecha | Problema | Solución aplicada |
|-------|----------|-------------------|
|       |          |                   |
|       |          |                   |
|       |          |                   |

---

## 9. GLOSARIO

| Término | Definición |
|---------|------------|
| Backend | Servidor del sistema (parte invisible que procesa los datos) |
| Frontend | Interfaz que ve y usa el usuario |
| Base de datos | Archivo donde se guarda toda la información (hotel.db) |
| Respaldo | Copia de seguridad de la base de datos |
| Soft delete | Eliminación lógica (el registro se desactiva pero no se borra) |
| Check-in | Ingreso del huésped al hotel |
| Check-out | Salida del huésped del hotel |
| JWT | Token de autenticación para mantener la sesión iniciada |