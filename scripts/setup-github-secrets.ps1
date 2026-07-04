#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Setup script for GitHub Actions Android release build.

.DESCRIPTION
    1) Validates the keystore (.p12) and prints its SHA-256.
    2) Prints the base64-encoded keystore content to copy into the
       ANDROID_KEYSTORE_BASE64 GitHub Secret.
    3) Sanity-checks keytool, node, npm, and PowerShell versions.

.NOTES
    Run this locally before pushing to GitHub. The base64 output is large;
    copy it as a single line into the GitHub secret value field.
#>

[CmdletBinding()]
param(
    [string]$KeystorePath = "c:\dev\trakl-test\android-upload-key.p12",
    [string]$ProjectRoot  = "c:\dev\trakl-test"
)

$ErrorActionPreference = "Stop"

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "    OK  $msg" -ForegroundColor Green }
function Warn($msg) { Write-Host "    !!  $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "    XX  $msg" -ForegroundColor Red; exit 1 }

# 1. Validate project root
Step "Validating project root: $ProjectRoot"
if (-not (Test-Path $ProjectRoot)) { Fail "Project root not found." }
if (-not (Test-Path (Join-Path $ProjectRoot ".github\workflows\react-native-cicd.yml"))) {
    Fail "Workflow file missing: .github/workflows/react-native-cicd.yml"
}
Ok "Project root and workflow file present."

# 2. Validate keystore
Step "Validating keystore: $KeystorePath"
if (-not (Test-Path $KeystorePath)) { Fail "Keystore not found." }
$keystoreBytes = [System.IO.File]::ReadAllBytes($KeystorePath)
$keystoreSize  = $keystoreBytes.Length
$keystoreHash  = (Get-FileHash -Path $KeystorePath -Algorithm SHA256).Hash
Ok "Size:  $keystoreSize bytes"
Ok "SHA256: $keystoreHash"
if ($keystoreSize -lt 100) { Fail "Keystore looks too small ($keystoreSize bytes)." }

# 3. Print base64 (single line) for the GitHub Secret
Step "Generating base64 for ANDROID_KEYSTORE_BASE64 secret"
$b64 = [Convert]::ToBase64String($keystoreBytes)
$b64Oneline = $b64 -replace "\s+", ""
$b64Len = $b64Oneline.Length
Ok "Base64 length: $b64Len chars"
Write-Host ""
Write-Host "---- COPY FROM HERE (single line) ----" -ForegroundColor Yellow
Write-Host $b64Oneline
Write-Host "---- END COPY ----" -ForegroundColor Yellow
Write-Host ""

# 4. Sanity-check tools
Step "Sanity-checking build tools"
$tools = @(
    @{ name = "node";  cmd = { node --version 2>$null } },
    @{ name = "npm";   cmd = { npm --version 2>$null } },
    @{ name = "java";  cmd = { java -version 2>&1 | Select-Object -First 1 } }
)
foreach ($t in $tools) {
    $out = & $t.cmd
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($out)) {
        Warn "$($t.name) not on PATH (OK for CI; this is just a local hint)"
    } else {
        Ok "$($t.name) -> $out"
    }
}

# 5. Git status
Step "Git status"
try {
    Push-Location $ProjectRoot
    $branch = git rev-parse --abbrev-ref HEAD 2>$null
    $remote = git remote get-url origin 2>$null
    if ($branch) { Ok "Current branch: $branch" } else { Warn "Not a git repo or detached." }
    if ($remote) { Ok "Remote: $remote" } else { Warn "No 'origin' remote configured." }
} catch {
    Warn "git status check failed: $_"
} finally {
    Pop-Location
}

Write-Host ""
Step "Summary"
Write-Host "    Workflow file: .github/workflows/react-native-cicd.yml"
Write-Host "    Required GitHub Secrets (Settings -> Secrets and variables -> Actions):"
Write-Host "      1. ANDROID_KEYSTORE_BASE64   (the single-line base64 above)"
Write-Host "      2. ANDROID_KEYSTORE_PASSWORD (PKCS12 password)"
Write-Host "      3. ANDROID_KEY_ALIAS         (key alias inside the .p12, e.g. 'upload')"
Write-Host "      4. ANDROID_KEY_PASSWORD      (key password; often same as store password)"
Write-Host ""
Write-Host "    To trigger: Actions tab -> 'React Native CI/CD (Android Release)' -> Run workflow."
Ok "Done."
