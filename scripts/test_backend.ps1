$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Python = Join-Path $Root ".venv\Scripts\python.exe"

if (!(Test-Path $Python)) {
  & (Join-Path $PSScriptRoot "setup_backend.ps1")
}

$env:BCRYPT_ROUNDS = "4"

& $Python -m pytest @args
