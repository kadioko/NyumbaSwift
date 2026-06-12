$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

npm.cmd run build

git diff --quiet -- app/frontend_bundle.py
if ($LASTEXITCODE -ne 0) {
  Write-Error "app/frontend_bundle.py is stale. Run npm run build and commit the regenerated bundle."
}
