$targetDir = "C:\Users\HP\.gemini\antigravity\brain\0dbbe9c6-c86c-4bd6-9851-0b4d8344efbb\screenshots"
if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

$p = Start-Process node -ArgumentList "backend/src/server.js" -PassThru -NoNewWindow
Start-Sleep -Seconds 3

$screenshots = @(
    @{ name = "student_landing_desktop.png"; size = "1280,800"; url = "http://localhost:5000/?view=student&lang=en" },
    @{ name = "student_landing_mobile.png";  size = "375,812";  url = "http://localhost:5000/?view=student&lang=or" },
    @{ name = "whatsapp_simulator_odia.png"; size = "1280,800"; url = "http://localhost:5000/?view=simulator&lang=or" },
    @{ name = "whatsapp_simulator_hindi.png";size = "1280,800"; url = "http://localhost:5000/?view=simulator&lang=hi" },
    @{ name = "eligibility_modal.png";       size = "1280,800"; url = "http://localhost:5000/?view=simulator&modal=eligibility" },
    @{ name = "tracking_modal.png";          size = "1280,800"; url = "http://localhost:5000/?view=simulator&modal=tracking" }
)

foreach ($s in $screenshots) {
    $outPath = Join-Path $targetDir $s.name
    Write-Host "Capturing $($s.name)..."
    cmd /c "`"$chrome`" --headless=new --disable-gpu --no-sandbox --hide-scrollbars --window-size=$($s.size) --screenshot=`"$outPath`" `"$($s.url)`""
}

Stop-Process -Id $p.Id -Force
Write-Host "Completed capturing all screenshots."
Get-ChildItem $targetDir
