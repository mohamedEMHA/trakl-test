# Wrapper for running act build in the background. Designed to survive
# timeouts in interactive shells. After act finishes (or even if it fails),
# copies any .aab found in the container to the host dist/ folder.

$ErrorActionPreference = "Continue"
$root = "c:\dev\trakl-test"
$log  = Join-Path $root "act-build.log"
$act  = Join-Path $root "scripts\act.exe"
$dist = Join-Path $root "dist"

Set-Location $root
New-Item -ItemType Directory -Path $dist -Force | Out-Null
Remove-Item $log -ErrorAction SilentlyContinue

& $act workflow_dispatch `
    --secret-file 'scripts\.act-secrets.env' `
    --input build_type=release-aab `
    -P ubuntu-latest=catthehacker/ubuntu:act-latest `
    --bind `
    2>&1 | Tee-Object -FilePath $log

$actExit = $LASTEXITCODE
Write-Host "act exit code: $actExit"

# Try to copy .aab out of the (still-running) container regardless of success.
Write-Host "Attempting to extract .aab from container..."
$containerName = docker ps -a --format '{{.Names}}' | Select-String -Pattern '^act-' | Select-Object -First 1
if ($containerName) {
    $name = ($containerName -split ':')[-1].Trim()
    Write-Host "Container: $name"
    # Find the .aab anywhere in the container.
    $aabPath = docker exec $name sh -c "find /mnt -name 'app-release.aab' -type f 2>/dev/null | head -1"
    if ($aabPath) {
        $aabPath = $aabPath.Trim()
        Write-Host "Found: $aabPath"
        docker cp "${name}:${aabPath}" "$dist\app-release.aab"
        if (Test-Path "$dist\app-release.aab") {
            $size = (Get-Item "$dist\app-release.aab").Length
            $hash = (Get-FileHash "$dist\app-release.aab" -Algorithm SHA256).Hash
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "  .aab EXTRACTED SUCCESSFULLY" -ForegroundColor Green
            Write-Host "  Path  : $dist\app-release.aab" -ForegroundColor Green
            Write-Host "  Size  : $size bytes" -ForegroundColor Green
            Write-Host "  SHA256: $hash" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
        }
    } else {
        Write-Host "No .aab found in container (build may have failed before packaging)." -ForegroundColor Yellow
    }
}

Write-Host "DONE"
