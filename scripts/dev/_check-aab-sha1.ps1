$f = 'C:\Users\moham\Downloads\app-release-aab\app-release.aab'
Write-Host "File: $f"
Write-Host "Size: $((Get-Item $f).Length) bytes"
Write-Host ""
Write-Host "==== Extracting signing cert SHA1 from .aab ===="
# Extract META-INF/*.RSA files and inspect them
$tempDir = New-TemporaryFile
Remove-Item $tempDir
New-Item -ItemType Directory -Path $tempDir.FullName | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($f)
foreach ($entry in $zip.Entries) {
    if ($entry.FullName -like "META-INF/*.RSA" -or $entry.FullName -like "META-INF/*.DSA" -or $entry.FullName -like "META-INF/*.EC" -or $entry.FullName -like "META-INF/*.SF") {
        Write-Host "  Found: $($entry.FullName) ($($entry.Length) bytes)"
    }
}
$zip.Dispose()

# Unzip to a temp folder and use keytool -printcert on the certs
$extractDir = Join-Path $env:TEMP "aab-extract-$([Guid]::NewGuid().ToString('N').Substring(0,8))"
New-Item -ItemType Directory -Path $extractDir | Out-Null
[System.IO.Compression.ZipFile]::ExtractToDirectory($f, $extractDir)
$rsa = Get-ChildItem -Path $extractDir -Recurse -Filter "*.RSA" -ErrorAction SilentlyContinue
if (-not $rsa) { $rsa = Get-ChildItem -Path $extractDir -Recurse -Filter "*.DSA" -ErrorAction SilentlyContinue }
if (-not $rsa) { $rsa = Get-ChildItem -Path $extractDir -Recurse -Filter "*.EC" -ErrorAction SilentlyContinue }
if ($rsa) {
    foreach ($f2 in $rsa) {
        Write-Host ""
        Write-Host "==== $($f2.Name) ===="
        & keytool -printcert -file $f2.FullName 2>&1 | Where-Object { $_ -match "SHA1|Owner|Issuer|Valid" } | Select-Object -First 10
    }
} else {
    Write-Host "No certificate files found in META-INF"
}
Remove-Item -Recurse -Force $extractDir -ErrorAction SilentlyContinue
