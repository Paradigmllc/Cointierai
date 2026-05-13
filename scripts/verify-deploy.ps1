# Cointier — Post-deploy verification
# 使い方: pwsh scripts/verify-deploy.ps1

$BASE = "http://ao5dx27lbmt97el0xss1kvrw.139.59.250.5.sslip.io"

Write-Host "Cointier Deploy Verification" -ForegroundColor Cyan
Write-Host "Base URL: $BASE`n" -ForegroundColor Gray

$tests = @(
    @{ path = "/ja";                desc = "Root locale redirect"; expectStatus = 200 }
    @{ path = "/en";                desc = "English locale";       expectStatus = 200 }
    @{ path = "/ja/coins";          desc = "Coins listing";        expectStatus = 200 }
    @{ path = "/ja/tier/s";         desc = "Tier S ranking";       expectStatus = 200 }
    @{ path = "/ja/pricing";        desc = "Pricing page";         expectStatus = 200 }
    @{ path = "/admin";             desc = "Admin gate";           expectStatus = 200 }  # redirects to /auth/login
    @{ path = "/api/coins";         desc = "Coins API";            expectStatus = 200 }
    @{ path = "/sitemap.xml";       desc = "Sitemap";              expectStatus = 200 }
    @{ path = "/robots.txt";        desc = "Robots";               expectStatus = 200 }
)

$pass = 0
$fail = 0

foreach ($t in $tests) {
    $url = "$BASE$($t.path)"
    try {
        $r = Invoke-WebRequest -Uri $url -MaximumRedirection 3 -UseBasicParsing -ErrorAction Stop
        $status = $r.StatusCode
        $bytes = $r.RawContentLength
        if ($status -eq $t.expectStatus) {
            Write-Host "PASS " -ForegroundColor Green -NoNewline
            Write-Host "$($t.path.PadRight(30)) $status ($bytes bytes)  — $($t.desc)" -ForegroundColor White
            $pass++
        } else {
            Write-Host "FAIL " -ForegroundColor Red -NoNewline
            Write-Host "$($t.path.PadRight(30)) expected $($t.expectStatus), got $status  — $($t.desc)" -ForegroundColor Yellow
            $fail++
        }
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        Write-Host "FAIL " -ForegroundColor Red -NoNewline
        Write-Host "$($t.path.PadRight(30)) error: $($_.Exception.Message.Split("`n")[0])" -ForegroundColor Yellow
        $fail++
    }
}

Write-Host "`nResults: $pass passed, $fail failed" -ForegroundColor Cyan
if ($fail -gt 0) { exit 1 }
