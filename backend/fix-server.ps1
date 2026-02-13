# 🛠️ GANGES Server Fix Script
# Automates: Killing port 3000, cleaning node processes, and regenerating Prisma.

Write-Host "`n--- Starting Ganges Server Cleanup ---" -ForegroundColor Cyan

# 1. Kill process on Port 3000
$port = 3000
$processId = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processId) {
    Write-Host "✅ Found process $processId on port $port. Killing it..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force
}
else {
    Write-Host "ℹ️ Port $port is already clear." -ForegroundColor Gray
}

# 2. Kill all node instances (releasing file locks)
Write-Host "✅ Cleaning up lingering node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# 3. Clean Prisma cache
Write-Host "✅ Cleaning Prisma client cache..." -ForegroundColor Yellow
if (Test-Path "node_modules/.prisma") {
    Remove-Item "node_modules/.prisma" -Recurse -Force
}

# 4. Regenerate Prisma Client
Write-Host "🚀 Regenerating Prisma Client..." -ForegroundColor Cyan
npx prisma generate

# 5. Start Server
Write-Host "`n🌟 Launching Ganges Backend..." -ForegroundColor Green
npm run dev
