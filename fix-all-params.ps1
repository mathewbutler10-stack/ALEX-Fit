# Fix all Next.js 14 params compatibility issues

$apiFiles = Get-ChildItem -Path "src\app\api" -Recurse -Include "route.ts" -File

foreach ($file in $apiFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if file has the old params pattern
    if ($content -match 'params.*:\s*{\s*params:\s*{\s*id:\s*string\s*}\s*}') {
        Write-Host "Fixing: $($file.FullName)"
        
        # Fix 1: Update function signature
        $content = $content -replace 'params.*:\s*{\s*params:\s*{\s*id:\s*string\s*}\s*}', 'params }: { params: Promise<{ id: string }> }'
        
        # Fix 2: Find params.id usage and replace with destructured await
        # Look for lines like "const somethingId = params.id;"
        if ($content -match 'const\s+(\w+)\s*=\s*params\.id\s*;') {
            $varName = $matches[1]
            Write-Host "  Found params.id assigned to: $varName"
            
            # Replace the function start to include await params
            if ($content -match '(export async function \w+\([^)]+\)\s*\{[\s\S]*?)const\s+(\w+)\s*=\s*params\.id\s*;') {
                $functionStart = $matches[1]
                $oldLine = "const $varName = params.id;"
                $newLine = "const { id: $varName } = await params;"
                $content = $content.Replace($functionStart + $oldLine, $functionStart + $newLine)
            }
        }
        
        Set-Content $file.FullName $content -Encoding UTF8
        Write-Host "  Fixed!" -ForegroundColor Green
    }
}

Write-Host "`nDone fixing Next.js 14 params compatibility issues!" -ForegroundColor Green