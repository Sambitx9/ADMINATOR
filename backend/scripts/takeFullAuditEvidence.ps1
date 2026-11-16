$targetDir = "D:\ADMINATOR\docs\audit-evidence"
if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (!(Test-Path $chrome)) {
    $chrome = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
}

Write-Host "Using Chrome at $chrome"

# Obtain JWT token for DRIEMS Admin
$loginBody = @{
    email = "admin@driems.ac.in"
    password = "DemoPassword123!"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$jwt = $loginRes.data.token
$userEnc = [System.Uri]::EscapeDataString(($loginRes.data.user | ConvertTo-Json -Compress))

Write-Host "Obtained JWT token for $($loginRes.data.user.name)"

$screenshots = @(
    # 1. Student Portal (10 viewports)
    @{ name = "01_student_portal_1920x1080.png"; size = "1920,1080"; url = "http://localhost:5000/?view=student&lang=en" },
    @{ name = "02_student_portal_1440x900.png";  size = "1440,900";  url = "http://localhost:5000/?view=student&lang=en" },
    @{ name = "03_student_portal_1366x768.png";  size = "1366,768";  url = "http://localhost:5000/?view=student&lang=en" },
    @{ name = "04_student_portal_1280x800.png";  size = "1280,800";  url = "http://localhost:5000/?view=student&lang=en" },
    @{ name = "05_student_portal_1024x768.png";  size = "1024,768";  url = "http://localhost:5000/?view=student&lang=en" },
    @{ name = "06_student_portal_768x1024.png";  size = "768,1024";  url = "http://localhost:5000/?view=student&lang=en" },
    @{ name = "07_student_portal_430x932.png";   size = "430,932";   url = "http://localhost:5000/?view=student&lang=en" },
    @{ name = "08_student_portal_390x844.png";   size = "390,844";   url = "http://localhost:5000/?view=student&lang=en" },
    @{ name = "09_student_portal_375x812.png";   size = "375,812";   url = "http://localhost:5000/?view=student&lang=en" },
    @{ name = "10_student_portal_360x800.png";   size = "360,800";   url = "http://localhost:5000/?view=student&lang=en" },

    # 2. WhatsApp Simulator in 3 Languages & Viewports
    @{ name = "11_simulator_english_1440x900.png"; size = "1440,900"; url = "http://localhost:5000/?view=simulator&lang=en" },
    @{ name = "12_simulator_hindi_1440x900.png";   size = "1440,900"; url = "http://localhost:5000/?view=simulator&lang=hi" },
    @{ name = "13_simulator_odia_1440x900.png";    size = "1440,900"; url = "http://localhost:5000/?view=simulator&lang=or" },
    @{ name = "14_simulator_mobile_375x812.png";   size = "375,812";  url = "http://localhost:5000/?view=simulator&lang=or" },
    @{ name = "15_simulator_mobile_360x800.png";   size = "360,800";  url = "http://localhost:5000/?view=simulator&lang=hi" },

    # 3. Modals
    @{ name = "16_eligibility_modal_1440x900.png"; size = "1440,900"; url = "http://localhost:5000/?view=simulator&modal=eligibility" },
    @{ name = "17_eligibility_modal_375x812.png";  size = "375,812";  url = "http://localhost:5000/?view=simulator&modal=eligibility" },
    @{ name = "18_tracking_modal_1440x900.png";    size = "1440,900"; url = "http://localhost:5000/?view=simulator&modal=tracking" },
    @{ name = "19_tracking_modal_375x812.png";     size = "375,812";  url = "http://localhost:5000/?view=simulator&modal=tracking" },

    # 4. Staff Login
    @{ name = "20_staff_login_1440x900.png"; size = "1440,900"; url = "http://localhost:5000/?view=staff&lang=en" },
    @{ name = "21_staff_login_375x812.png";  size = "375,812";  url = "http://localhost:5000/?view=staff&lang=or" },

    # 5. Staff CRM Pipeline
    @{ name = "22_staff_pipeline_1920x1080.png"; size = "1920,1080"; url = "http://localhost:5000/?view=staff&tab=pipeline&token=$jwt&user=$userEnc" },
    @{ name = "23_staff_pipeline_1440x900.png";  size = "1440,900";  url = "http://localhost:5000/?view=staff&tab=pipeline&token=$jwt&user=$userEnc" },
    @{ name = "24_staff_pipeline_768x1024.png";  size = "768,1024";  url = "http://localhost:5000/?view=staff&tab=pipeline&token=$jwt&user=$userEnc" },
    @{ name = "25_staff_pipeline_375x812.png";   size = "375,812";   url = "http://localhost:5000/?view=staff&tab=pipeline&token=$jwt&user=$userEnc" },

    # 6. Staff CRM Lead Drawer
    @{ name = "26_staff_drawer_1440x900.png"; size = "1440,900"; url = "http://localhost:5000/?view=staff&tab=pipeline&openDrawer=true&token=$jwt&user=$userEnc" },
    @{ name = "27_staff_drawer_375x812.png";  size = "375,812";  url = "http://localhost:5000/?view=staff&tab=pipeline&openDrawer=true&token=$jwt&user=$userEnc" },

    # 7. Staff CRM Overview
    @{ name = "28_staff_overview_1440x900.png"; size = "1440,900"; url = "http://localhost:5000/?view=staff&tab=overview&token=$jwt&user=$userEnc" },
    @{ name = "29_staff_overview_768x1024.png"; size = "768,1024"; url = "http://localhost:5000/?view=staff&tab=overview&token=$jwt&user=$userEnc" },

    # 8. Staff CRM Audit Ledger
    @{ name = "30_staff_audit_1440x900.png"; size = "1440,900"; url = "http://localhost:5000/?view=staff&tab=audit&token=$jwt&user=$userEnc" },
    @{ name = "31_staff_audit_768x1024.png"; size = "768,1024"; url = "http://localhost:5000/?view=staff&tab=audit&token=$jwt&user=$userEnc" },

    # 9. Staff CRM Student Roster (65 Records)
    @{ name = "32_staff_roster_1440x900.png"; size = "1440,900"; url = "http://localhost:5000/?view=staff&tab=students&token=$jwt&user=$userEnc" },
    @{ name = "33_staff_roster_375x812.png";  size = "375,812";  url = "http://localhost:5000/?view=staff&tab=students&token=$jwt&user=$userEnc" }
)

foreach ($s in $screenshots) {
    $outPath = Join-Path $targetDir $s.name
    Write-Host "Capturing $($s.name) [$($s.size)]..."
    cmd /c "`"$chrome`" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=$($s.size) --virtual-time-budget=2000 --screenshot=`"$outPath`" `"$($s.url)`""
}

Write-Host "Completed capturing all 33 full audit evidence screenshots in $targetDir"
Get-ChildItem $targetDir | Measure-Object | Select-Object Count
