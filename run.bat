@echo off
SETLOCAL EnableDelayedExpansion

echo Checking for Node.js...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is not installed or not in your PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Checking for dependencies (node_modules)...
if not exist "node_modules\" (
    echo node_modules not found. Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo Error: npm install failed.
        pause
        exit /b 1
    )
)

echo Starting OPM-Pro v1...
call npm run dev

pause
