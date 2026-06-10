@echo off
title SISTEMA DE GESTION HOTELERA
color 0A

echo ========================================
echo    SISTEMA DE GESTION HOTELERA
echo    Iniciando, por favor espere...
echo ========================================
echo.

cd /d "C:\Users\alvar\Documents\Proyecto_Ingenieria_Software_II"

:: Iniciar backend
echo [1/2] Iniciando servidor backend...
cd backend
start "HOTEL Backend" cmd /k "venv\Scripts\activate && python run.py"
cd ..
echo [OK] Backend iniciado
echo.

:: Esperar 5 segundos
timeout /t 5 /nobreak > nul

:: Iniciar frontend
echo [2/2] Iniciando interfaz...
cd frontend
start "HOTEL Frontend" cmd /k "npm run dev"
cd ..
echo [OK] Frontend iniciado
echo.

:: Esperar 8 segundos
timeout /t 8 /nobreak > nul

:: Abrir navegador
echo Abriendo navegador...
start http://localhost:5173

echo.
echo ========================================
echo    SISTEMA INICIADO!
echo    Si no abre, ve a http://localhost:5173
echo ========================================
pause