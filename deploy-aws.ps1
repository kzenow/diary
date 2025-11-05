# PowerShell script to deploy to AWS S3 + CloudFront
# Usage: .\deploy-aws.ps1

param(
    [string]$BucketName = "my-diary-app",
    [string]$DistributionId = "",
    [string]$Region = "us-east-1"
)

Write-Host "=== AWS Deployment Script ===" -ForegroundColor Green
Write-Host ""

# Check if AWS CLI is installed
if (-not (Get-Command "aws" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: AWS CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Check AWS credentials
Write-Host "Checking AWS credentials..." -ForegroundColor Cyan
$awsIdentity = aws sts get-caller-identity 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: AWS credentials not configured." -ForegroundColor Red
    Write-Host "Run: aws configure" -ForegroundColor Yellow
    exit 1
}
Write-Host "AWS credentials OK" -ForegroundColor Green
Write-Host ""

# Build the app
Write-Host "Building the app..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "Build completed successfully" -ForegroundColor Green
Write-Host ""

# Upload to S3
Write-Host "Uploading to S3 bucket: $BucketName..." -ForegroundColor Cyan
aws s3 sync dist/ "s3://$BucketName" --delete --region $Region
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: S3 upload failed" -ForegroundColor Red
    exit 1
}
Write-Host "Upload to S3 completed" -ForegroundColor Green
Write-Host ""

# Invalidate CloudFront cache if distribution ID provided
if ($DistributionId) {
    Write-Host "Invalidating CloudFront cache..." -ForegroundColor Cyan
    aws cloudfront create-invalidation --distribution-id $DistributionId --paths "/*"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: CloudFront invalidation failed" -ForegroundColor Yellow
    } else {
        Write-Host "CloudFront cache invalidated" -ForegroundColor Green
    }
    Write-Host ""
} else {
    Write-Host "Skipping CloudFront invalidation (no distribution ID provided)" -ForegroundColor Yellow
    Write-Host "To invalidate CloudFront, run:" -ForegroundColor Yellow
    Write-Host ".\deploy-aws.ps1 -BucketName '$BucketName' -DistributionId 'YOUR_DIST_ID'" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Check your S3 bucket: https://s3.console.aws.amazon.com/s3/buckets/$BucketName" -ForegroundColor White
if ($DistributionId) {
    Write-Host "2. Wait ~2-5 minutes for CloudFront to update" -ForegroundColor White
    Write-Host "3. Access your app via CloudFront URL" -ForegroundColor White
}
