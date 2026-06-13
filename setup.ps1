#!/usr/bin/env powershell
<#
.SYNOPSIS
    AccessAI Setup Script - Installs dependencies and starts all services

.DESCRIPTION
    This script will:
    1. Check/install Node.js if needed
    2. Install frontend npm packages
    3. Set up Python virtual environment for backend
    4. Install Python packages
    5. Start both services

.EXAMPLE
    .\setup.ps1
    .\setup.ps1 -FrontendOnly
    .\setup.ps1 -BackendOnly
#>

param(
    [switch]$FrontendOnly,
    [switch]$BackendOnly,
    [switch]$Docker
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "  ╔═══════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║   AccessAI — Accessibility Audit Agent    ║" -ForegroundColor Cyan
Write-Host "  ║   Setup & Launch Script v1.0.0            ║" -ForegroundColor Cyan
Write-Host "  ╚═══════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ─── Docker Mode ───────────────────────────────────────────────────────
if ($Docker) {
    Write-Host "🐳 Starting with Docker Compose..." -ForegroundColor Magenta
    
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Host "✗ Docker not found. Install Docker Desktop from https://docker.com" -ForegroundColor Red
        exit 1
    }
    
    # Copy env file if needed
    if (-not (Test-Path "$ProjectRoot\.env")) {
        Copy-Item "$ProjectRoot\.env.example" "$ProjectRoot\.env"
        Write-Host "✓ Created .env from .env.example (edit it to add your GROQ_API_KEY)" -ForegroundColor Yellow
    }
    
    Set-Location $ProjectRoot
    docker compose up --build -d
    
    Write-Host ""
    Write-Host "✅ AccessAI is running!" -ForegroundColor Green
    Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "   Backend:  http://localhost:8000" -ForegroundColor Cyan
    Write-Host "   API Docs: http://localhost:8000/api/docs" -ForegroundColor Cyan
    exit 0
}

# ─── Check Node.js ─────────────────────────────────────────────────────
if (-not $BackendOnly) {
    Write-Host "📦 Checking Node.js..." -ForegroundColor Yellow
    
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if (-not $nodeCmd) {
        Write-Host "  Node.js not found. Attempting to install via winget..." -ForegroundColor Yellow
        
        if (Get-Command winget -ErrorAction SilentlyContinue) {
            winget install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
            
            # Refresh PATH
            $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
            $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
        }
        
        if (-not $nodeCmd) {
            Write-Host "  ✗ Could not install Node.js automatically." -ForegroundColor Red
            Write-Host "  Please install Node.js manually: https://nodejs.org/en/download" -ForegroundColor Red
            Write-Host "  Then re-run this script." -ForegroundColor Red
            if (-not $FrontendOnly) { 
                Write-Host "  Continuing with backend setup only..." -ForegroundColor Yellow
                $BackendOnly = $true
            } else {
                exit 1
            }
        }
    }
    
    if ($nodeCmd) {
        $nodeVersion = node --version
        Write-Host "  ✓ Node.js $nodeVersion found" -ForegroundColor Green
    }
}

# ─── Install Frontend Dependencies ─────────────────────────────────────
if (-not $BackendOnly) {
    Write-Host ""
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    
    Set-Location "$ProjectRoot\frontend"
    
    if (-not (Test-Path "node_modules")) {
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ✗ npm install failed" -ForegroundColor Red
        } else {
            Write-Host "  ✓ Frontend dependencies installed" -ForegroundColor Green
        }
    } else {
        Write-Host "  ✓ node_modules already exists (skipping)" -ForegroundColor Green
    }
}

# ─── Set up Python Backend ─────────────────────────────────────────────
if (-not $FrontendOnly) {
    Write-Host ""
    Write-Host "🐍 Setting up Python backend..." -ForegroundColor Yellow
    
    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if (-not $pythonCmd) {
        Write-Host "  ✗ Python not found. Install from https://python.org" -ForegroundColor Red
        exit 1
    }
    
    $pyVersion = python --version
    Write-Host "  ✓ $pyVersion found" -ForegroundColor Green
    
    Set-Location "$ProjectRoot\backend"
    
    # Create virtual environment
    if (-not (Test-Path "venv")) {
        Write-Host "  Creating virtual environment..." -ForegroundColor Yellow
        python -m venv venv
        Write-Host "  ✓ Virtual environment created" -ForegroundColor Green
    }
    
    # Install packages
    Write-Host "  Installing Python packages..." -ForegroundColor Yellow
    & ".\venv\Scripts\pip.exe" install -r requirements.txt --quiet
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ Package installation failed" -ForegroundColor Red
    } else {
        Write-Host "  ✓ Python packages installed" -ForegroundColor Green
    }
    
    # Create .env if needed
    if (-not (Test-Path "$ProjectRoot\.env")) {
        Copy-Item "$ProjectRoot\.env.example" "$ProjectRoot\.env"
        Write-Host "  ✓ Created .env file (edit it to add GROQ_API_KEY)" -ForegroundColor Yellow
    }
}

# ─── Start Services ─────────────────────────────────────────────────────
Write-Host ""
Write-Host "🚀 Starting services..." -ForegroundColor Cyan
Write-Host ""

if (-not $FrontendOnly) {
    # Start backend in new window
    $backendCmd = "cd '$ProjectRoot\backend'; .\venv\Scripts\activate; python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd -WindowStyle Normal
    Write-Host "  ✓ Backend starting at http://localhost:8000" -ForegroundColor Green
    Write-Host "    API Docs: http://localhost:8000/api/docs" -ForegroundColor Gray
    Start-Sleep 2
}

if (-not $BackendOnly) {
    # Start frontend in new window
    $frontendCmd = "cd '$ProjectRoot\frontend'; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd -WindowStyle Normal
    Write-Host "  ✓ Frontend starting at http://localhost:5173" -ForegroundColor Green
    Start-Sleep 3
    
    # Open browser
    Start-Process "http://localhost:5173"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host "  ✅ AccessAI is running!" -ForegroundColor Green
Write-Host ""
Write-Host "  🌐 App:      http://localhost:5173" -ForegroundColor Cyan
Write-Host "  🔌 API:      http://localhost:8000" -ForegroundColor Cyan
Write-Host "  📚 API Docs: http://localhost:8000/api/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "  To stop: Close the PowerShell windows or Ctrl+C" -ForegroundColor Gray
Write-Host "═══════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""
