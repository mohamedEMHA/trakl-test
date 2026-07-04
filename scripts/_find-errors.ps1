$log = Get-Content 'c:\dev\trakl-test\act-build.log'
$lines = $log -split "`n"
$matches = @()
for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    if ($line -match "(Failure|Failed|error::|FAILURE)" -and $line -notmatch "add-matcher|DEP0040|errors\.com|deprecated") {
        $matches += [PSCustomObject]@{
            LineNum = $i + 1
            Line = $line.Substring(0, [Math]::Min(200, $line.Length))
        }
    }
}
$matches | Select-Object -First 30 | Format-Table -AutoSize -Wrap
Write-Host "Total lines in log: $($lines.Length)"
