# Auto-push script for GitHub
# This script will add, commit, and push all changes to GitHub

param(
    [string]$CommitMessage = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

Write-Host "=== GitHub Auto-Push Script ===" -ForegroundColor Green
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Error: Not a git repository. Please run 'git init' first." -ForegroundColor Red
    exit 1
}

# Check for changes
Write-Host "Checking for changes..." -ForegroundColor Yellow
$status = git status --porcelain
if (-not $status) {
    Write-Host "No changes to commit." -ForegroundColor Yellow
    exit 0
}

# Show status
Write-Host "Current status:" -ForegroundColor Cyan
git status --short

Write-Host ""
Write-Host "Adding all changes..." -ForegroundColor Yellow
git add .

Write-Host "Committing changes..." -ForegroundColor Yellow
git commit -m $CommitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Commit failed." -ForegroundColor Red
    exit 1
}

Write-Host "Pulling latest changes from remote..." -ForegroundColor Yellow
git pull origin main --allow-unrelated-histories --no-rebase

if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Pull failed. Attempting to push anyway..." -ForegroundColor Yellow
}

Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/NoraStuart22/secure-trade-wallet" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "✗ Push failed. Please check the error above." -ForegroundColor Red
    exit 1
}

