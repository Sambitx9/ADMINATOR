$targetDir = "C:\Users\HP\.gemini\antigravity\brain\0dbbe9c6-c86c-4bd6-9851-0b4d8344efbb\screenshots"
if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

# Rebuild frontend to ensure latest build is served
npm --prefix frontend run build

# Start backend server
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
    # 1. Student Portal across viewports
    @{ name = "01_student_portal_desktop_1440.png"; size = "1440,900";  url = "http://localhost:5000/?view=student&lang=or" },
    @{ name = "02_student_portal_desktop_1280.png"; size = "1280,800";  url = "http://localhost:5000/?view=student&lang=hi" },
    @{ name = "03_student_portal_tablet_768.png";   size = "768,1024";  url = "http://localhost:5000/?view=student&lang=en" },
    @{ name = "04_student_portal_mobile_375.png";   size = "375,812";   url = "http://localhost:5000/?view=student&lang=or" },

    # 2. WhatsApp Simulator across viewports
    @{ name = "05_whatsapp_simulator_desktop_1440.png"; size = "1440,900"; url = "http://localhost:5000/?view=simulator&lang=or" },
    @{ name = "06_whatsapp_simulator_tablet_768.png";   size = "768,1024"; url = "http://localhost:5000/?view=simulator&lang=hi" },
    @{ name = "07_whatsapp_simulator_mobile_375.png";   size = "375,812";  url = "http://localhost:5000/?view=simulator&lang=or" },

    # 3. Staff Login across viewports
    @{ name = "08_staff_login_desktop_1440.png"; size = "1440,900"; url = "http://localhost:5000/?view=staff&lang=en" },
    @{ name = "09_staff_login_tablet_768.png";   size = "768,1024"; url = "http://localhost:5000/?view=staff&lang=or" },
    @{ name = "10_staff_login_mobile_375.png";   size = "375,812";  url = "http://localhost:5000/?view=staff&lang=hi" },

    # 4. Staff Dashboard (Overview & Pipeline) across viewports
    @{ name = "11_staff_overview_desktop_1440.png"; size = "1440,900"; url = "http://localhost:5000/?view=staff&tab=overview&token=$jwt&user=$userEnc" },
    @{ name = "12_staff_pipeline_desktop_1440.png"; size = "1440,900"; url = "http://localhost:5000/?view=staff&tab=pipeline&token=$jwt&user=$userEnc" },
    @{ name = "13_staff_pipeline_desktop_1280.png"; size = "1280,800"; url = "http://localhost:5000/?view=staff&tab=pipeline&token=$jwt&user=$userEnc" },
    @{ name = "14_staff_pipeline_tablet_768.png";   size = "768,1024"; url = "http://localhost:5000/?view=staff&tab=pipeline&token=$jwt&user=$userEnc" },
    @{ name = "15_staff_pipeline_mobile_375.png";   size = "375,812";  url = "http://localhost:5000/?view=staff&tab=pipeline&token=$jwt&user=$userEnc" },

    # 5. Lead Detail Drawer across viewports
    @{ name = "16_lead_drawer_desktop_1440.png"; size = "1440,900"; url = "http://localhost:5000/?view=staff&tab=pipeline&openDrawer=true&token=$jwt&user=$userEnc" },
    @{ name = "17_lead_drawer_tablet_768.png";   size = "768,1024"; url = "http://localhost:5000/?view=staff&tab=pipeline&openDrawer=true&token=$jwt&user=$userEnc" },

    # 6. Audit Ledger across viewports
    @{ name = "18_audit_ledger_desktop_1440.png"; size = "1440,900"; url = "http://localhost:5000/?view=staff&tab=audit&token=$jwt&user=$userEnc" },
    @{ name = "19_audit_ledger_tablet_768.png";   size = "768,1024"; url = "http://localhost:5000/?view=staff&tab=audit&token=$jwt&user=$userEnc" }
)

foreach ($s in $screenshots) {
    $outPath = Join-Path $targetDir $s.name
    Write-Host "Capturing $($s.name) [$($s.size)]..."
    cmd /c "`"$chrome`" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=$($s.size) --virtual-time-budget=2500 --screenshot=`"$outPath`" `"$($s.url)`""
}

Stop-Process -Id $p.Id -Force
Write-Host "Completed capturing all Task 4.4 release screenshots."
Get-ChildItem $targetDir | Sort-Object Name
