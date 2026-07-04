foreach ($f in @(
    "c:\dev\trakl-test\scripts\local-dry-run.ps1",
    "c:\dev\trakl-test\scripts\encode-keystore.ps1",
    "c:\dev\trakl-test\scripts\run-dry-run.ps1",
    "c:\dev\trakl-test\scripts\setup-github-secrets.ps1"
)) {
    $errors = $null
    $tokens = $null
    $ast = [System.Management.Automation.Language.Parser]::ParseFile($f, [ref]$tokens, [ref]$errors)
    if ($errors.Count -gt 0) {
        Write-Host "FAIL  $f" -ForegroundColor Red
        $errors | ForEach-Object { Write-Host "      $_" -ForegroundColor Red }
    } else {
        Write-Host "OK    $f" -ForegroundColor Green
    }
}
