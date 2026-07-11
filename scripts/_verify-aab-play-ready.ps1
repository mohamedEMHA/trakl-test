#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Verify a local Android App Bundle (.aab) is ready for Google Play Console.

.DESCRIPTION
    Checks:
      - File exists and size
      - Signing certificate SHA1 (so you can compare with Play Console)
      - ABIs / native libraries included
      - Top-level bundle structure
      - Presence of META-INF signing files

    If the SHA1 printed here does NOT match the upload certificate in
    Play Console > App integrity > App signing, the upload will be rejected
    or existing users will not be able to upgrade.

.PARAMETER AabPath
    Path to the .aab file to inspect.
#>

[CmdletBinding()]
param(
    [string]$AabPath = "C:\Users\moham\Downloads\app-release-aab\app-release.aab"
)

$ErrorActionPreference = "Stop"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "    OK  $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "    !!  $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "    XX  $msg" -ForegroundColor Red; exit 1 }

if (-not (Test-Path $AabPath)) { Fail "AAB not found: $AabPath" }

$item = Get-Item $AabPath
Ok "File: $AabPath"
Ok "Size: $($item.Length) bytes ($([math]::Round($item.Length/1MB, 2)) MB)"

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($AabPath)

try {
    Step "Top-level modules"
    $seen = @()
    $zip.Entries | Select-Object -ExpandProperty FullName -Unique | ForEach-Object {
        $top = ($_ -split "/")[0]
        if ($top -notin $seen) {
            $seen += $top
            Write-Host "    $top/"
        }
    }

    Step "Native libraries (ABIs)"
    $libs = $zip.Entries |
        Where-Object { $_.FullName -like "lib/*" -or $_.FullName -like "*/lib/*" } |
        Select-Object -ExpandProperty FullName -Unique |
        ForEach-Object { ($_ -split "/")[1] } |
        Select-Object -Unique
    if (-not $libs) {
        Warn "No lib/ entries found."
    } else {
        $libs | ForEach-Object { Ok "ABI: $_" }
    }

    Step "Signing certificate files in META-INF"
    $certs = $zip.Entries |
        Where-Object { $_.FullName -like "META-INF/*.RSA" -or
                       $_.FullName -like "META-INF/*.DSA" -or
                       $_.FullName -like "META-INF/*.EC" } |
        Select-Object -ExpandProperty FullName -Unique
    if (-not $certs) {
        Fail "No signing certificate files found in META-INF. The AAB is not signed."
    }
    $certs | ForEach-Object { Write-Host "    $_" }
}
finally {
    $zip.Dispose()
}

Step "Signing certificate SHA1"
$extractDir = Join-Path $env:TEMP "aab-verify-$([Guid]::NewGuid().ToString('N').Substring(0,8))"
New-Item -ItemType Directory -Path $extractDir | Out-Null
try {
    [System.IO.Compression.ZipFile]::ExtractToDirectory($AabPath, $extractDir)
    $rsa = Get-ChildItem -Path $extractDir -Recurse -Filter "*.RSA" -ErrorAction SilentlyContinue |
           Select-Object -First 1
    if (-not $rsa) { $rsa = Get-ChildItem -Path $extractDir -Recurse -Filter "*.DSA" -ErrorAction SilentlyContinue | Select-Object -First 1 }
    if (-not $rsa) { $rsa = Get-ChildItem -Path $extractDir -Recurse -Filter "*.EC" -ErrorAction SilentlyContinue | Select-Object -First 1 }
    if (-not $rsa) { Fail "Could not extract certificate from AAB" }

    $print = & keytool -printcert -file $rsa.FullName 2>&1
    $sha1 = $print | Where-Object { $_ -match "SHA1:" } | ForEach-Object { $_.Trim() }
    if (-not $sha1) { Warn "Could not read SHA1 from certificate" }
    Write-Host "    Certificate: $($rsa.FullName.Replace($extractDir, ''))" -ForegroundColor Gray
    Write-Host "    $sha1" -ForegroundColor Green
    Write-Host ""
    Write-Host "    Compare this SHA1 with Play Console > App integrity > App signing > Upload key certificate." -ForegroundColor Yellow
    Write-Host "    If they differ, existing users CANNOT upgrade to this release." -ForegroundColor Yellow
}
finally {
    Remove-Item -Recurse -Force $extractDir -ErrorAction SilentlyContinue
}

Step "Next steps"
Write-Host "    1. Upload the .aab to Play Console."
Write-Host "    2. If deobfuscation warning appears, also upload:"
Write-Host "       android/app/build/outputs/mapping/release/mapping.txt"
Write-Host "    3. If Play Console rejects the release, verify:"
Write-Host "       - applicationId matches the existing app"
Write-Host "       - versionCode is greater than the previous release"
Write-Host "       - signing certificate SHA1 matches the registered upload key"

Ok "Verification complete."
