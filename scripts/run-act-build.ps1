# Wrapper for running act build in the background. Designed to survive
# timeouts in interactive shells.

$ErrorActionPreference = "Continue"
$root = "c:\dev\trakl-test"
$log  = Join-Path $root "act-build.log"
$act  = Join-Path $root "scripts\act.exe"

Set-Location $root
Remove-Item $log -ErrorAction SilentlyContinue

& $act workflow_dispatch `
    --secret-file 'scripts\.act-secrets.env' `
    --input build_type=release-aab `
    -P ubuntu-latest=catthehacker/ubuntu:act-latest `
    --bind `
    2>&1 | Tee-Object -FilePath $log

Write-Host "DONE exit=$LASTEXITCODE"
