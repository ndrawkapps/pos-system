# Run Inventory Migrations
# Usage: .\run_migrations.ps1

$host_port = "cgk1.clusters.zeabur.com:23821"
$user = "root"
$database = "zeabur"

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  POS System - Inventory Migration Script" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This script will run the following migrations:" -ForegroundColor Yellow
Write-Host "  1. add_car_wash_payment_method.sql" -ForegroundColor White
Write-Host "  2. create_inventory_system.sql" -ForegroundColor White
Write-Host ""
Write-Host "Target Database:" -ForegroundColor Yellow
Write-Host "  Host: $host_port" -ForegroundColor White
Write-Host "  User: $user" -ForegroundColor White
Write-Host "  Database: $database" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Continue? (y/n)"
if ($continue -ne "y") {
    Write-Host "Cancelled." -ForegroundColor Red
    exit
}

$password = Read-Host "Enter MySQL password" -AsSecureString
$plain_password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

Write-Host ""
Write-Host "Running migrations..." -ForegroundColor Cyan

# Check if mysql client is available
$mysql_path = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysql_path) {
    Write-Host "ERROR: MySQL client not found!" -ForegroundColor Red
    Write-Host "Please install MySQL client or use MySQL Workbench instead." -ForegroundColor Yellow
    exit
}

# Migration 1: Car Wash Payment Method
Write-Host ""
Write-Host "[1/2] Adding Car Wash payment method..." -ForegroundColor Yellow
$file1 = Join-Path $PSScriptRoot "add_car_wash_payment_method.sql"
if (Test-Path $file1) {
    mysql -h $host_port -u $user -p"$plain_password" $database < $file1 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Car Wash payment method added successfully!" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Failed to add Car Wash payment method" -ForegroundColor Red
        Write-Host "  You may need to run this migration manually via MySQL Workbench" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✗ File not found: $file1" -ForegroundColor Red
}

# Migration 2: Inventory System
Write-Host ""
Write-Host "[2/2] Creating inventory system tables..." -ForegroundColor Yellow
$file2 = Join-Path $PSScriptRoot "create_inventory_system.sql"
if (Test-Path $file2) {
    mysql -h $host_port -u $user -p"$plain_password" $database < $file2 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Inventory system tables created successfully!" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Failed to create inventory tables" -ForegroundColor Red
        Write-Host "  You may need to run this migration manually via MySQL Workbench" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✗ File not found: $file2" -ForegroundColor Red
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Migration Complete!" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Verify tables created: ingredients, product_recipes, stock_movements" -ForegroundColor White
Write-Host "  2. Test frontend inventory pages (admin only)" -ForegroundColor White
Write-Host "  3. Set up some ingredients and recipes" -ForegroundColor White
Write-Host ""
