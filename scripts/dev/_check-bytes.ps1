$f = 'c:\dev\trakl-test\scripts\.act-secrets.env'
$b = [System.IO.File]::ReadAllBytes($f)
Write-Host "First 3 bytes: 0x$($b[0].ToString('X2')) 0x$($b[1].ToString('X2')) 0x$($b[2].ToString('X2'))"
Write-Host "Length: $($b.Length)"
Write-Host "CR count: $(($b | Where-Object { $_ -eq 13 }).Count)"
Write-Host "LF count: $(($b | Where-Object { $_ -eq 10 }).Count)"
Write-Host "Last 3 bytes: 0x$($b[-3].ToString('X2')) 0x$($b[-2].ToString('X2')) 0x$($b[-1].ToString('X2'))"
