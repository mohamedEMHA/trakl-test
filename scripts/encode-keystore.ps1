#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Encode the Android upload keystore (.p12) to a single-line base64 file
    ready to paste into the ANDROID_KEYSTORE_BASE64 GitHub Secret.

.DESCRIPTION
    Reads the .p12 file, base64-encodes it, and writes the result to
    .github/.secrets/android-upload-key.base64.txt (gitignored) so it can be
    reviewed/copied safely without leaving the repository tree.

    It also prints SHA-256 and length for verification.

.PARAMETER KeystorePath
    Path to the .p12 keystore. Defaults to c:\dev\trakl-test\android-upload-key.p12.

.PARAMETER OutDir
    Where to write the base64 file. Defaults to .github\.secrets in the project root.
#>

[CmdletBinding()]
param(
    [string]$KeystorePath = "c:\dev\trakl-test\android-upload-key.p12",
    [string]$OutDir       = "c:\dev\trakl-test\.github\.secrets"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $KeystorePath)) {
    Write-Host "Keystore not found: $KeystorePath" -ForegroundColor Red
    exit 1
}

# Make sure the output directory is gitignored before writing any secret material.
$gitignorePath = Join-Path (Split-Path $OutDir -Parent) ".gitignore"
$gitignoreMarker = ".secrets/"
$existing = if (Test-Path $gitignorePath) { Get-Content $gitignorePath -Raw } else { "" }
if ($existing -notmatch [regex]::Escape($gitignoreMarker)) {
    Add-Content -Path $gitignorePath -Value "`n# Local CI secret material`n$gitignoreMarker"
}

New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
$outFile = Join-Path $OutDir "android-upload-key.base64.txt"

$bytes = [System.IO.File]::ReadAllBytes($KeystorePath)
$b64   = [Convert]::ToBase64String($bytes) -replace "\s+", ""

Set-Content -Path $outFile -Value $b64 -NoNewline -Encoding ASCII

$hash = (Get-FileHash -Path $KeystorePath -Algorithm SHA256).Hash
$len  = $b64.Length
$size = $bytes.Length

Write-Host ""
Write-Host "Keystore" -ForegroundColor Cyan
Write-Host "    Path   : $KeystorePath"
Write-Host "    Size   : $size bytes"
Write-Host "    SHA256 : $hash"
Write-Host ""
Write-Host "Base64 secret" -ForegroundColor Cyan
Write-Host "    File   : $outFile"
Write-Host "    Length : $len chars (single line)"
Write-Host ""
Write-Host "Next steps" -ForegroundColor Cyan
Write-Host "    1. Open the file above, copy the single line."
Write-Host "    2. GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret"
Write-Host "       Name : ANDROID_KEYSTORE_BASE64"
Write-Host "       Value: <paste>"
Write-Host "    3. Add the remaining 3 secrets (see scripts\setup-github-secrets.ps1 output)."
Write-Host ""
