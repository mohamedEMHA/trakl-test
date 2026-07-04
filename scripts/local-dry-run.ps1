#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Local dry-run of the GitHub Actions Android release workflow.

.DESCRIPTION
    Mirrors the steps in .github/workflows/react-native-cicd.yml on the local
    Windows host. Used to validate the pipeline before the first CI push.

    Steps:
      1) expo prebuild --platform android --clean (regenerate android/)
      2) Decode ANDROID_KEYSTORE_BASE64 -> upload-keystore.p12
      3) keytool: p12 -> jks
      4) Patch gradle.properties (MYAPP_UPLOAD_*)
      5) ./gradlew bundleRelease
      6) Locate and copy the .aab to dist/

.PARAMETER KeystoreBase64Path
    Path to the base64-encoded keystore. Default: .github/.secrets/android-upload-key.base64.txt

.PARAMETER StorePassword
    PKCS12 password. Falls back to $env:ANDROID_KEYSTORE_PASSWORD.

.PARAMETER KeyAlias
    Key alias. Falls back to $env:ANDROID_KEY_ALIAS. Default: "upload".

.PARAMETER KeyPassword
    Key password. Falls back to $env:ANDROID_KEY_PASSWORD. Defaults to StorePassword.
#>

[CmdletBinding()]
param(
    [string]$ProjectRoot       = "c:\dev\trakl-test",
    [string]$KeystoreBase64Path = "",
    [string]$StorePassword     = "",
    [string]$KeyAlias          = "",
    [string]$KeyPassword       = ""
)

$ErrorActionPreference = "Stop"
$ProgressPreference    = "Continue"

function Step($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ok($m)   { Write-Host "    OK  $m" -ForegroundColor Green }
function Warn($m) { Write-Host "    !!  $m" -ForegroundColor Yellow }

# Resolve secrets from env if not passed.
if (-not $KeystoreBase64Path) { $KeystoreBase64Path = Join-Path $ProjectRoot ".github\.secrets\android-upload-key.base64.txt" }
if (-not $StorePassword)      { $StorePassword = $env:ANDROID_KEYSTORE_PASSWORD }
if (-not $KeyAlias)           { $KeyAlias      = $env:ANDROID_KEY_ALIAS; if (-not $KeyAlias) { $KeyAlias = "upload" } }
if (-not $KeyPassword)        { $KeyPassword   = $env:ANDROID_KEY_PASSWORD; if (-not $KeyPassword) { $KeyPassword = $StorePassword } }

# Guard rails.
if (-not (Test-Path $ProjectRoot))      { throw "Project root not found: $ProjectRoot" }
if (-not (Test-Path $KeystoreBase64Path)) { throw "Base64 keystore not found: $KeystoreBase64Path (run scripts\encode-keystore.ps1 first)" }
if (-not $StorePassword) { throw "Store password missing. Pass -StorePassword or set $env:ANDROID_KEYSTORE_PASSWORD" }

Push-Location $ProjectRoot
try {
    Step "0. Pre-flight checks"
    $nodeV = (& node --version).Trim()
    $npmV  = (& npm --version).Trim()
    $javaV = (& cmd /c "java -version 2>&1") -join " "
    Ok "node: $nodeV"
    Ok "npm : $npmV"
    Ok "java: $javaV"
    if (-not ($javaV -match "version\s+""?17")) {
        Warn "Java is not 17. Gradle 8.13 may complain. Check ANDROID_KEYSTORE_PASSWORD set OK."
    }

    Step "1. expo prebuild --platform android --clean --no-install"
    & npx expo prebuild --platform android --clean --no-install
    if ($LASTEXITCODE -ne 0) { throw "expo prebuild failed" }
    Ok "android/ regenerated"

    Step "2. Decode ANDROID_KEYSTORE_BASE64 -> upload-keystore.p12"
    $b64 = Get-Content $KeystoreBase64Path -Raw
    $bytes = [Convert]::FromBase64String(($b64 -replace "\s+",""))
    $p12Path = Join-Path $ProjectRoot "android\app\upload-keystore.p12"
    [System.IO.File]::WriteAllBytes($p12Path, $bytes)
    Ok "Wrote $p12Path ($($bytes.Length) bytes)"

    Step "3. Convert p12 -> jks (keytool)"
    $jksPath = Join-Path $ProjectRoot "android\app\upload-keystore.jks"
    & keytool -importkeystore `
        -srckeystore $p12Path `
        -srcstoretype PKCS12 `
        -srcstorepass $StorePassword `
        -srckeypass   $StorePassword `
        -destkeystore $jksPath `
        -deststoretype JKS `
        -deststorepass $StorePassword `
        -destkeypass   $KeyPassword `
        -noprompt
    if ($LASTEXITCODE -ne 0) { throw "keytool failed" }
    Ok "Wrote $jksPath"

    Step "4. Patch gradle.properties (MYAPP_UPLOAD_*)"
    $gpPath = Join-Path $ProjectRoot "android\gradle.properties"
    $gp = Get-Content $gpPath -Raw
    function Set-Or-Append($text, $key, $value) {
        $line = "$key=$value"
        if ($text -match "(?m)^$key=") {
            return [regex]::Replace($text, "(?m)^$key=.*$", [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $line }, [System.Text.RegularExpressions.RegexOptions]::Multiline)
        } else {
            return $text + "`n" + $line + "`n"
        }
    }
    $gp = Set-Or-Append $gp "MYAPP_UPLOAD_STORE_FILE"     "upload-keystore.jks"
    $gp = Set-Or-Append $gp "MYAPP_UPLOAD_KEY_ALIAS"      $KeyAlias
    $gp = Set-Or-Append $gp "MYAPP_UPLOAD_STORE_PASSWORD" $StorePassword
    $gp = Set-Or-Append $gp "MYAPP_UPLOAD_KEY_PASSWORD"   $KeyPassword
    Set-Content -Path $gpPath -Value $gp -Encoding UTF8
    Ok "Patched $gpPath"
    Get-Content $gpPath | Select-String -Pattern "^MYAPP_UPLOAD_" | ForEach-Object { "    $($_.Line)" }

    Step "5. ./gradlew bundleRelease"
    $gradlew = Join-Path $ProjectRoot "android\gradlew.bat"
    Push-Location (Join-Path $ProjectRoot "android")
    try {
        $env:NODE_OPTIONS = "--openssl-legacy-provider"
        & $gradlew bundleRelease --no-daemon --stacktrace
        if ($LASTEXITCODE -ne 0) { throw "gradle build failed" }
    } finally {
        Pop-Location
    }

    Step "6. Locate the .aab"
    $aabDir = Join-Path $ProjectRoot "android\app\build\outputs\bundle\release"
    $aab = Get-ChildItem -Path $aabDir -Filter "*.aab" -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $aab) { throw "No .aab found under $aabDir" }
    $dist = Join-Path $ProjectRoot "dist"
    New-Item -ItemType Directory -Path $dist -Force | Out-Null
    Copy-Item -Path $aab.FullName -Destination (Join-Path $dist $aab.Name) -Force
    $size = (Get-Item $aab.FullName).Length
    Ok "AAB: $($aab.FullName) ($size bytes)"
    Ok "Copied to: $(Join-Path $dist $aab.Name)"
}
finally {
    Pop-Location
}

Write-Host ""
Ok "Local dry-run succeeded."
