$response = Invoke-RestMethod -Uri http://localhost:3000/api-docs/swagger.json
Write-Host "`n=== Swagger API Paths Detected ===" -ForegroundColor Cyan

if ($response.paths.PSObject.Properties.Count -eq 0) {
    Write-Host "  No paths detected!" -ForegroundColor Red
    Write-Host "`nDebugging info:" -ForegroundColor Yellow
    Write-Host "  OpenAPI version: $($response.openapi)" -ForegroundColor Gray
    Write-Host "  API title: $($response.info.title)" -ForegroundColor Gray
}
else {
    $response.paths.PSObject.Properties | ForEach-Object {
        $path = $_.Name
        $methods = $_.Value.PSObject.Properties.Name -join ", "
        Write-Host "  $path [$methods]" -ForegroundColor Green
    }
    Write-Host "`nTotal paths: $($response.paths.PSObject.Properties.Count)" -ForegroundColor Yellow
    
    # Count tags
    $tags = @{}
    $response.paths.PSObject.Properties | ForEach-Object {
        $_.Value.PSObject.Properties | ForEach-Object {
            if ($_.Value.tags) {
                $_.Value.tags | ForEach-Object { $tags[$_] = $true }
            }
        }
    }
    Write-Host "Tags: $($tags.Keys -join ', ')" -ForegroundColor Cyan
}
