$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $Root ".venv\Scripts\python.exe"

if (!(Test-Path $Python)) {
  & (Join-Path $PSScriptRoot "setup_backend.ps1")
}

$DatabasePath = Join-Path $Root ".tmp\alembic_check.db"
New-Item -ItemType Directory -Force (Split-Path -Parent $DatabasePath) | Out-Null
if (Test-Path $DatabasePath) {
  Remove-Item $DatabasePath
}

$env:DATABASE_URL = "sqlite:///$($DatabasePath.Replace('\', '/'))"

& $Python -m alembic upgrade head
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

& $Python -m alembic downgrade base
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
