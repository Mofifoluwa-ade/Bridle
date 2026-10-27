param (
    [Parameter(Mandatory=$true, Position=0)]
    [string]$ContractAccount,
    
    [Parameter(Mandatory=$false, Position=1)]
    [string]$ExecutorAccount = $ContractAccount
)

$ErrorActionPreference = "Stop"
$wasmPath = Join-Path $PSScriptRoot "res\bridle_contract.wasm"

if (!(Test-Path $wasmPath)) {
    Write-Host "WASM binary not found. Running build..."
    & (Join-Path $PSScriptRoot "build-contract.ps1")
}

Write-Host "==> Target Contract: $ContractAccount"
Write-Host "==> Executor Account: $ExecutorAccount"
Write-Host "==> WASM Binary: $wasmPath"

$env:NEAR_ENV = "testnet"

# Check if credentials exist for this account
$credPath = Join-Path $env:USERPROFILE ".near-credentials\testnet\$ContractAccount.json"
if (!(Test-Path $credPath)) {
    Write-Host ""
    Write-Host "==> No stored keys found for $ContractAccount."
    Write-Host "Launching NEAR browser login to authenticate..."
    npx -y near-cli login
}

Write-Host ""
Write-Host "==> Deploying $wasmPath to $ContractAccount and calling 'new'..."
$initArgs = "{`"executor`":`"$ExecutorAccount`"}"
npx -y near-cli deploy --accountId $ContractAccount --wasmFile $wasmPath --initFunction new --initArgs $initArgs

Write-Host ""
Write-Host "SUCCESS: Contract deployed and initialized on NEAR Testnet!"

# Write or update .env.local automatically
$envLocalPath = Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..")) ".env.local"
$envContent = @"
NEXT_PUBLIC_NEAR_NETWORK=testnet
NEXT_PUBLIC_BRIDLE_CONTRACT=$ContractAccount
NEXT_PUBLIC_NEAR_RPC=https://test.rpc.fastnear.com
NEXT_PUBLIC_EXPLORER=https://testnet.nearblocks.io
"@

Set-Content -Path $envLocalPath -Value $envContent -Encoding utf8
Write-Host "Saved configuration to $envLocalPath"
Write-Host "Done! Restart your dev server with 'npm run dev' to use live testnet contracts."
