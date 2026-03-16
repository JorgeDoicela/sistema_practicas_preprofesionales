@echo off
echo ======================================================
echo   LIMPIEZA DE PROYECTO - EMITESIS WEB
echo ======================================================

echo [1/3] Finalizando procesos de Node.js...
taskkill /F /IM node.exe /T 2>nul

echo [2/3] Eliminando cache .next...
if exist .next (
    rmdir /S /Q .next
    echo   - Carpeta .next eliminada.
) else (
    echo   - Carpeta .next no encontrada, saltando...
)

echo [3/3] Limpiando archivos temporales...
if exist out rmdir /S /Q out
if exist .turbo rmdir /S /Q .turbo

echo ======================================================
echo   LIMPIEZA COMPLETADA EXITOSAMENTE
echo ======================================================
pause
