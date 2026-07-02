param(
    [string]$OutputDir = "..\frontend\src-tauri\binaries"
)

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Test-Path ".venv\Scripts\python.exe")) {
    throw "Crie o venv em backend antes: python -m venv .venv"
}

.\.venv\Scripts\Activate.ps1
pip install pyinstaller | Out-Null

$target = "backend-x86_64-pc-windows-msvc"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

pyinstaller `
    --noconfirm `
    --onefile `
    --name $target `
    --distpath $OutputDir `
    --workpath "build\pyinstaller" `
    --specpath "build\pyinstaller" `
    --hidden-import=uvicorn.logging `
    --hidden-import=uvicorn.loops `
    --hidden-import=uvicorn.loops.auto `
    --hidden-import=uvicorn.protocols `
    --hidden-import=uvicorn.protocols.http `
    --hidden-import=uvicorn.protocols.http.auto `
    --hidden-import=uvicorn.lifespan `
    --hidden-import=uvicorn.lifespan.on `
    run_server.py

Write-Host "Sidecar gerado em $OutputDir\$target.exe"
