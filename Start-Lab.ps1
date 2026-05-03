param(
    [int]$Port = 8081
)

# Karate Interactive Learning Lab - Startup Script

Write-Host ""
Write-Host "==============================================" -ForegroundColor Magenta
Write-Host "   🥋 Karate Interactive Learning Lab        " -ForegroundColor Yellow -BackgroundColor DarkRed
Write-Host "==============================================" -ForegroundColor Magenta
Write-Host ""

Write-Host "🚀 Starting local server on port $Port..." -ForegroundColor Gray
Write-Host "📝 Note: This lab provides interactive Karate DSL exercises." -ForegroundColor Cyan

# Check if npx is available
if (!(Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: 'npx' not found. Please install Node.js first." -ForegroundColor Red
    pause
    exit
}

# Open the browser in a separate thread so it doesn't wait for the server to finish
Start-Sleep -Seconds 2
Write-Host "🔗 Opening Lab at http://localhost:$Port/app/" -ForegroundColor Yellow
Start-Process "http://localhost:$Port/app/"

# Run the server on the specified port
npx serve . -l $Port
