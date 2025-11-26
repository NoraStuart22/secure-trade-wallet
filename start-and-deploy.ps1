# Start Hardhat node and deploy EncryptedBidding contract
Write-Host "Starting Hardhat node..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npx hardhat node" -WindowStyle Minimized

# Wait for node to start
Start-Sleep -Seconds 5

Write-Host "Deploying EncryptedBidding contract..." -ForegroundColor Green
npx hardhat deploy --network localhost

Write-Host "Deployment complete! Contract address saved in deployments/localhost/EncryptedBidding.json" -ForegroundColor Green
Write-Host "To use the contract in the frontend, set VITE_CONTRACT_ADDRESS environment variable" -ForegroundColor Yellow

