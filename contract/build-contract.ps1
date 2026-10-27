$ErrorActionPreference = "Stop"
$target = Join-Path $env:TEMP "bridle-cargo-target"
$env:CARGO_TARGET_DIR = $target
Write-Host "Building WASM contract into $target..."

$cargoPath = Join-Path $env:USERPROFILE ".cargo\bin\cargo.exe"
& $cargoPath build --target wasm32-unknown-unknown --release -j 2

if ($LASTEXITCODE -eq 0) {
    $wasmSource = Join-Path $target "wasm32-unknown-unknown\release\bridle_contract.wasm"
    $outDir = Join-Path $PSScriptRoot "res"
    if (!(Test-Path $outDir)) {
        New-Item -ItemType Directory -Path $outDir | Out-Null
    }
    $wasmDest = Join-Path $outDir "bridle_contract.wasm"
    Copy-Item $wasmSource $wasmDest -Force
    $size = (Get-Item $wasmDest).Length
    Write-Host "SUCCESS: WASM built to $wasmDest ($size bytes)"
} else {
    exit $LASTEXITCODE
}
