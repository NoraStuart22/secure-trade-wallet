# Git Push Script for Trust Build Ledger
# Usage: .\push-changes.ps1

Write-Host "=== Trust Build Ledger - Git Push Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if there are changes
$status = git status --short
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No changes to commit." -ForegroundColor Yellow
    exit 0
}

# Show current status
Write-Host "Current changes:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Ask for commit message
$message = Read-Host "Enter commit message (or press Enter for default)"
if ([string]::IsNullOrWhiteSpace($message)) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $message = "Update: $timestamp"
}

# Add all changes
Write-Host "Adding changes..." -ForegroundColor Cyan
git add .

# Commit
Write-Host "Committing changes..." -ForegroundColor Cyan
git commit -m $message

if ($LASTEXITCODE -ne 0) {
    Write-Host "Commit failed!" -ForegroundColor Red
    exit 1
}

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Changes pushed successfully!" -ForegroundColor Green
    Write-Host "View on GitHub: https://github.com/VincentDierser/trust-build-ledger" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✗ Push failed!" -ForegroundColor Red
    Write-Host "You may need to pull first: git pull origin main" -ForegroundColor Yellow
    exit 1
}

