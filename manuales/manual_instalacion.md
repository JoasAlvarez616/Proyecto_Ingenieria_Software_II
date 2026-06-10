---
title: "Sistema de Gestión Hotelera"
subtitle: "Manual de Instalación"
author: "Luis Miranda | Aníbal Silva | Jesús López | Joás Álvarez"
date: "10 de junio de 2026"
---

# MANUAL DE INSTALACIÓN

## ⚠️ IMPORTANTE

**Este proceso debe ser realizado por una persona con conocimientos técnicos (ingeniero de sistemas, técnico en computación o alguien familiarizado con instalación de software).**

El usuario final (recepcionista, dueño del hotel) **NO debe intentar instalar Python ni Node.js por su cuenta**. Solicite ayuda a un profesional.

Una vez instalado, el usuario solo usará el archivo `INICIAR_SISTEMA.bat` para encender el sistema.

---

## ¿Qué necesita el técnico?

| Software | Versión | ¿Para qué? |
|----------|---------|-------------|
| Python | 3.10 o superior | Para que funcione el servidor |
| Node.js | 18 o superior | Para que funcione la pantalla |

---

## Paso 1: Instalar Python

1. Ir a https://www.python.org/downloads/
2. Descargar Python 3.10 o superior
3. Ejecutar el instalador
4. **IMPORTANTE:** Marcar la opción **"Add Python to PATH"**
5. Hacer clic en "Install Now"

---

## Paso 2: Instalar Node.js

1. Ir a https://nodejs.org/
2. Descargar la versión LTS
3. Ejecutar el instalador
4. Siguiente, siguiente, instalar

---

## Paso 3: Copiar el sistema

Copiar la carpeta **"Sistema_Hotel"** al escritorio o a `C:\`

---

## Paso 4: Iniciar por primera vez

1. Abrir la carpeta **"Sistema_Hotel"**
2. Hacer doble clic en **INICIAR_SISTEMA.bat**
3. Esperar de 2 a 5 minutos
4. El navegador se abrirá solo

---

## Paso 5: Acceder al sistema

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin | admin123 | Administrador |
| recepcionista | hotel123 | Recepcionista |

---

## ¿Cómo apagar?

- Cerrar las ventanas negras
- Cerrar el navegador

---

## ¿El navegador no se abre?

Escribir manualmente: `http://localhost:5173`

---

## ¿No carga?

Esperar 10 segundos y presionar F5

---

## Solución de problemas rápida

| Problema | Solución |
|----------|----------|
| No inicia | Verificar Python y Node.js instalados |
| Puerto ocupado | Reiniciar la computadora |
| Pantalla rara | Recargar con Ctrl + Shift + R |

---

## ¿Ayuda?

Consultar los manuales en la carpeta "manuales"