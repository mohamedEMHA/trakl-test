param(
    [string]$AabPath = 'C:\Users\moham\Downloads\app-release-aab\app-release.aab'
)

if (-not (Test-Path $AabPath)) {
    throw "AAB not found: $AabPath"
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($AabPath)

# Check for native libs (lib/) and split ABIs
Write-Host "==== lib/ entries (ABIs) ===="
$libs = $zip.Entries | Where-Object { $_.FullName -like "lib/*" -or $_.FullName -like "*/lib/*" } | Select-Object -ExpandProperty FullName -Unique
if ($libs) {
    $libs | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "  (no lib/ entries)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==== base/ entries (first 5) ===="
$base = $zip.Entries | Where-Object { $_.FullName -like "base/*" } | Select-Object -ExpandProperty FullName -Unique | Select-Object -First 5
$base | ForEach-Object { Write-Host "  $_" }

Write-Host ""
Write-Host "==== top-level entries ===="
$seen = @()
$zip.Entries | Select-Object -ExpandProperty FullName -Unique | ForEach-Object {
    $top = ($_ -split "/")[0]
    if ($top -notin $seen) {
        $seen += $top
        Write-Host "  $top/"
    }
}

Write-Host ""
Write-Host "==== META-INF signing files ===="
$certs = $zip.Entries | Where-Object { $_.FullName -like "META-INF/*.RSA" -or $_.FullName -like "META-INF/*.DSA" -or $_.FullName -like "META-INF/*.EC" } | Select-Object -ExpandProperty FullName -Unique
if ($certs) {
    $certs | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "  (none found)" -ForegroundColor Red
}

$zip.Dispose()
