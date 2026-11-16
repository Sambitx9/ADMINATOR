$targetDir = "D:\ADMINATOR\docs\audit-evidence"
$artDir = "C:\Users\HP\.gemini\antigravity\brain\0dbbe9c6-c86c-4bd6-9851-0b4d8344efbb\screenshots"
if (!(Test-Path $targetDir)) { New-Item -ItemType Directory -Path $targetDir -Force | Out-Null }
if (!(Test-Path $artDir)) { New-Item -ItemType Directory -Path $artDir -Force | Out-Null }

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (!(Test-Path $chrome)) {
    $chrome = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
}

Write-Host "Using Chrome at $chrome"

$loginBody = @{
    email = "admin@driems.ac.in"
    password = "DemoPassword123!"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$jwt = $loginRes.data.token
$userEnc = [System.Uri]::EscapeDataString(($loginRes.data.user | ConvertTo-Json -Compress))

$screenshots = @(
    @{ name = "hotfix_01_student_portal_en.png"; size = "1440,900"; url = "http://localhost:5000/?view=student&lang=en" },
    @{ name = "hotfix_02_student_portal_or.png"; size = "1440,900"; url = "http://localhost:5000/?view=student&lang=or" },
    @{ name = "hotfix_03_student_portal_hi.png"; size = "1440,900"; url = "http://localhost:5000/?view=student&lang=hi" },
    @{ name = "hotfix_04_simulator_en.png"; size = "1440,900"; url = "http://localhost:5000/?view=simulator&lang=en" },
    @{ name = "hotfix_05_simulator_or.png"; size = "1440,900"; url = "http://localhost:5000/?view=simulator&lang=or" },
    @{ name = "hotfix_06_simulator_hi.png"; size = "1440,900"; url = "http://localhost:5000/?view=simulator&lang=hi" },
    @{ name = "hotfix_07_eligibility_modal_or.png"; size = "1440,900"; url = "http://localhost:5000/?view=simulator&lang=or&modal=eligibility" },
    @{ name = "hotfix_08_eligibility_modal_hi.png"; size = "1440,900"; url = "http://localhost:5000/?view=simulator&lang=hi&modal=eligibility" },
    @{ name = "hotfix_09_tracking_modal_or.png"; size = "1440,900"; url = "http://localhost:5000/?view=simulator&lang=or&modal=tracking" },
    @{ name = "hotfix_10_tracking_modal_hi.png"; size = "1440,900"; url = "http://localhost:5000/?view=simulator&lang=hi&modal=tracking" },
    @{ name = "hotfix_11_staff_crm_pipeline_or.png"; size = "1440,900"; url = "http://localhost:5000/?view=staff&lang=or&tab=pipeline&token=$jwt&user=$userEnc" },
    @{ name = "hotfix_12_staff_crm_pipeline_hi.png"; size = "1440,900"; url = "http://localhost:5000/?view=staff&lang=hi&tab=pipeline&token=$jwt&user=$userEnc" }
)

foreach ($s in $screenshots) {
    $outPath = Join-Path $targetDir $s.name
    $artPath = Join-Path $artDir $s.name
    Write-Host "Capturing $($s.name)..."
    cmd /c "`"$chrome`" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=$($s.size) --virtual-time-budget=2500 --screenshot=`"$outPath`" `"$($s.url)`""
    if (Test-Path $outPath) {
        Copy-Item $outPath $artPath -Force
        Write-Host "  ✓ Saved: $($s.name)"
    } else {
        Write-Host "  ✗ Failed: $($s.name)"
    }
}

Write-Host "Finished capturing Hotfix Batch 1 screenshots."
