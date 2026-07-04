# Build the act secrets file from the encoded base64 + hardcoded credentials.
# Writes to scripts\.act-secrets.env (gitignored).

$ErrorActionPreference = "Stop"

$base64File = Join-Path $PSScriptRoot "..\.github\.secrets\android-upload-key.base64.txt"
$template   = Join-Path $PSScriptRoot "act-secrets.template.env"
$output     = Join-Path $PSScriptRoot ".act-secrets.env"

if (-not (Test-Path $base64File)) {
    throw "Run scripts\encode-keystore.ps1 first to produce $base64File"
}
if (-not (Test-Path $template)) {
    throw "Missing template: $template"
}

$b64 = (Get-Content $base64File -Raw).Trim()
$content = Get-Content $template -Raw
$content = $content.Replace("__REPLACE_WITH_BASE64__", $b64)
# Normalize to LF-only line endings (act/godotenv require LF).
$content = $content -replace "`r`n", "`n"
# Use UTF-8 WITHOUT BOM (required by `act`'s env-file parser).
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($output, $content, $utf8NoBom)

# Ensure gitignore covers the generated file
$gitignore = Join-Path $PSScriptRoot "..\.gitignore"
$gi = Get-Content $gitignore -Raw
if ($gi -notmatch "act-secrets\.env") {
    Add-Content -Path $gitignore -Value "`n.act-secrets.env"
}

Write-Host "Wrote: $output" -ForegroundColor Green
Get-Content $output | ForEach-Object { $line = $_; if ($line -like "ANDROID_KEYSTORE_BASE64=*") { Write-Host ("ANDROID_KEYSTORE_BASE64=" + $line.Substring("ANDROID_KEYSTORE_BASE64=".Length).Substring(0, 40) + "...[truncated]") } else { Write-Host $line } }
