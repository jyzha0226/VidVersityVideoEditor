@echo off
set "SCRIPT_DIR=%~dp0"

cd /d "%SCRIPT_DIR%"

if not exist "node_modules" (
    echo node_modules not found. Running npm install...
    call npm install
    if errorlevel 1 (
        echo npm install failed.
        pause
        exit /b 1
    )
)

start "Subtitles Server" cmd /k "cd /d ""%SCRIPT_DIR%"" && npm run subtitles:server"
start "Dev Server" cmd /k "cd /d ""%SCRIPT_DIR%"" && npm run dev"