$targetDir = "C:\Users\HP\.gemini\antigravity\brain\0dbbe9c6-c86c-4bd6-9851-0b4d8344efbb\screenshots"
if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (!(Test-Path $chrome)) {
    $chrome = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
}

Write-Host "Using Chrome at $chrome"

# Perform login as DRIEMS Admin
$loginBody = @{
    email = "admin@driems.ac.in"
    password = "DemoPassword123!"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$jwt = $loginRes.data.token
$userEnc = [System.Uri]::EscapeDataString(($loginRes.data.user | ConvertTo-Json -Compress))

Write-Host "Obtained JWT token for $($loginRes.data.user.name)"

$screenshots = @(
    # 1. WhatsApp Simulator in English with DRIEMS default
    @{ name = "20_whatsapp_en_driems.png"; size = "1440,900"; url = "http://localhost:5000/?view=simulator&lang=en" },
    
    # 2. WhatsApp Simulator in Hindi with Devanagari placeholder
    @{ name = "21_whatsapp_hi_response.png"; size = "1440,900"; url = "http://localhost:5000/?view=simulator&lang=hi" },
    
    # 3. WhatsApp Simulator in Odia with Odia placeholder
    @{ name = "22_whatsapp_or_response.png"; size = "1440,900"; url = "http://localhost:5000/?view=simulator&lang=or" },
    
    # 4. Student Portal Hero with DRIEMS preview
    @{ name = "23_hero_driems_default.png"; size = "1440,900"; url = "http://localhost:5000/?view=student&lang=en" },
    
    # 5. Staff Login with DRIEMS quick fill chips
    @{ name = "24_staff_login_driems_chips.png"; size = "1440,900"; url = "http://localhost:5000/?view=staff&lang=en" },
    
    # 6. Staff CRM Overview for DRIEMS
    @{ name = "25_staff_crm_driems_admin.png"; size = "1440,900"; url = "http://localhost:5000/?view=staff&tab=overview&token=$jwt&user=$userEnc" },
    
    # 7. Staff CRM Student Roster showing 65 records
    @{ name = "26_staff_student_roster_65.png"; size = "1440,900"; url = "http://localhost:5000/?view=staff&tab=students&token=$jwt&user=$userEnc" }
)

foreach ($s in $screenshots) {
    $outPath = Join-Path $targetDir $s.name
    Write-Host "Capturing $($s.name) [$($s.size)]..."
    cmd /c "`"$chrome`" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=$($s.size) --virtual-time-budget=2500 --screenshot=`"$outPath`" `"$($s.url)`""
}

Write-Host "Completed capturing all critical correction screenshots."
Get-ChildItem $targetDir\2*.png | Sort-Object Name
