# Local CI dry-run wrapper.
# Sets secrets from a local file (gitignored) and invokes local-dry-run.ps1.
# Usage: powershell -File scripts\run-dry-run.ps1
# Or just run scripts\local-dry-run.ps1 directly with -StorePassword.

$ErrorActionPreference = "Stop"

# Hard-coded for local test only. DO NOT commit real secrets.
$env:ANDROID_KEYSTORE_PASSWORD = "vKqE_w5hPH-pduUrxDVGk3N-RIP8BUJ7"
$env:ANDROID_KEY_ALIAS         = "upload"
$env:ANDROID_KEY_PASSWORD      = $env:ANDROID_KEYSTORE_PASSWORD

& (Join-Path $PSScriptRoot "local-dry-run.ps1") `
    -StorePassword $env:ANDROID_KEYSTORE_PASSWORD `
    -KeyAlias      $env:ANDROID_KEY_ALIAS `
    -KeyPassword   $env:ANDROID_KEY_PASSWORD
