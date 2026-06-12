$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$VenvPath = Join-Path $Root ".venv"
$Python = Join-Path $VenvPath "Scripts\python.exe"

if (!(Test-Path $Python)) {
  python -m venv $VenvPath
}

& $Python -m pip install --upgrade pip
& $Python -m pip install -r (Join-Path $Root "requirements.txt")
& $Python -m pip check
