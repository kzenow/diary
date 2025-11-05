#!/bin/bash

# Bash script to deploy to AWS S3 + CloudFront
# Usage: ./deploy-aws.sh [bucket-name] [distribution-id]

set -e

BUCKET_NAME="${1:-my-diary-app}"
DISTRIBUTION_ID="${2:-}"
REGION="${AWS_REGION:-us-east-1}"

echo "=== AWS Deployment Script ==="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI not found. Please install it first:"
    echo "https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "Error: AWS credentials not configured."
    echo "Run: aws configure"
    exit 1
fi
echo "AWS credentials OK"
echo ""

# Build the app
echo "Building the app..."
npm run build
echo "Build completed successfully"
echo ""

# Upload to S3
echo "Uploading to S3 bucket: $BUCKET_NAME..."
aws s3 sync dist/ "s3://$BUCKET_NAME" --delete --region "$REGION"
echo "Upload to S3 completed"
echo ""

# Invalidate CloudFront cache if distribution ID provided
if [ -n "$DISTRIBUTION_ID" ]; then
    echo "Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*"
    echo "CloudFront cache invalidated"
    echo ""
else
    echo "Skipping CloudFront invalidation (no distribution ID provided)"
    echo "To invalidate CloudFront, run:"
    echo "./deploy-aws.sh $BUCKET_NAME YOUR_DISTRIBUTION_ID"
    echo ""
fi

echo "=== Deployment Complete! ==="
echo ""
echo "Next steps:"
echo "1. Check your S3 bucket: https://s3.console.aws.amazon.com/s3/buckets/$BUCKET_NAME"
if [ -n "$DISTRIBUTION_ID" ]; then
    echo "2. Wait ~2-5 minutes for CloudFront to update"
    echo "3. Access your app via CloudFront URL"
fi
