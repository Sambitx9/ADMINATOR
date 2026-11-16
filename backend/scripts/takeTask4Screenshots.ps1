$targetDir = "C:\Users\HP\.gemini\antigravity\brain\0dbbe9c6-c86c-4bd6-9851-0b4d8344efbb\screenshots"
if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

$p = Start-Process node -ArgumentList "backend/src/server.js" -PassThru -NoNewWindow
Start-Sleep -Seconds 3

# Perform login to obtain token for authenticated screenshots
$loginBody = @{
    email = "admin@kipt.ac.in"
    password = "DemoPassword123!"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$jwt = $loginRes.data.token
$userEnc = [System.Uri]::EscapeDataString(($loginRes.data.user | ConvertTo-Json -Compress))

Write-Host "Obtained JWT token for $($loginRes.data.user.name)"

$screenshots = @(
    @{ name = "staff_login_desktop.png";    size = "1280,800"; url = "http://localhost:5000/?view=staff&lang=en" },
    @{ name = "staff_pipeline_desktop.png"; size = "1280,800"; url = "http://localhost:5000/?view=staff&tab=pipeline&token=$jwt&user=$userEnc" },
    @{ name = "staff_drawer_desktop.png";   size = "1280,800"; url = "http://localhost:5000/?view=staff&tab=pipeline&openDrawer=true&token=$jwt&user=$userEnc" },
    @{ name = "staff_overview_desktop.png"; size = "1280,800"; url = "http://localhost:5000/?view=staff&tab=overview&token=$jwt&user=$userEnc" },
    @{ name = "staff_audit_desktop.png";    size = "1280,800"; url = "http://localhost:5000/?view=staff&tab=audit&token=$jwt&user=$userEnc" },
    @{ name = "staff_pipeline_mobile.png";  size = "375,812";  url = "http://localhost:5000/?view=staff&tab=pipeline&token=$jwt&user=$userEnc" }
)

foreach ($s in $screenshots) {
    $outPath = Join-Path $targetDir $s.name
    Write-Host "Capturing $($s.name)..."
    cmd /c "`"$chrome`" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=$($s.size) --screenshot=`"$outPath`" `"$($s.url)`""
}

Stop-Process -Id $p.Id -Force
Write-Host "Completed capturing all Task 4.3 screenshots."
Get-ChildItem $targetDir | Where-Object { $_.Name -like "staff_*" }
