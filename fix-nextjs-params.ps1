# PowerShell script to fix Next.js 14 params compatibility issue
# In Next.js 14+, params is a Promise that needs to be awaited

$files = @(
    "src\app\api\clients\[id]\meal-ratings\route.ts",
    "src\app\api\meal-plans\[id]\grocery-list\route.ts",
    "src\app\api\meal-plans\[id]\swap\route.ts",
    "src\app\api\meals\[id]\rate\route.ts",
    "src\app\api\meals\[id]\ratings\route.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Fixing $file"
        $content = Get-Content $file -Raw
        
        # Fix function signature: { params }: { params: { id: string } } -> { params }: { params: Promise<{ id: string }> }
        $content = $content -replace 'params.*:\s*{\s*params:\s*{\s*id:\s*string\s*}\s*}', 'params }: { params: Promise<{ id: string }> }'
        
        # Fix usage: params.id -> await params then destructure
        # This is more complex and needs per-file adjustment
        # We'll handle this manually for now
        Write-Host "  Note: May need manual adjustment for params usage"
        
        Set-Content $file $content
    } else {
        Write-Host "File not found: $file"
    }
}

Write-Host "Done! Check each file for params usage (params.id should become (await params).id)"