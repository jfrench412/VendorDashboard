#!/bin/bash

# Avahi Dashboard - S3 Static Deployment Script
# This script deploys the static version of the dashboard to S3

set -e  # Exit on any error

# Configuration
BUCKET_NAME="avahi-dashboard-sgk-main"
REGION="us-east-1"
PROFILE="default"  # Change to your AWS profile name

echo "🚀 Starting deployment to S3..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if bucket exists, create if not
echo "📦 Checking if bucket exists..."
if ! aws s3 ls "s3://$BUCKET_NAME" --profile $PROFILE 2>/dev/null; then
    echo "🆕 Creating S3 bucket: $BUCKET_NAME"
    aws s3 mb "s3://$BUCKET_NAME" --region $REGION --profile $PROFILE
    
    # Enable static website hosting
    echo "🌐 Enabling static website hosting..."
    aws s3 website "s3://$BUCKET_NAME" \
        --index-document index.html \
        --error-document index.html \
        --profile $PROFILE
    
    # Set bucket policy for public access
    echo "🔓 Setting bucket policy for public access..."
    cat > bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF
    
    aws s3api put-bucket-policy \
        --bucket $BUCKET_NAME \
        --policy file://bucket-policy.json \
        --profile $PROFILE
    
    rm bucket-policy.json
else
    echo "✅ Bucket already exists"
fi

# Sync files to S3
echo "📤 Uploading files to S3..."
aws s3 sync ./avahi_dashboard/ "s3://$BUCKET_NAME" \
    --delete \
    --profile $PROFILE \
    --exclude "*.md" \
    --exclude "proxy-server.js" \
    --exclude "test-jira.js" \
    --exclude "debug-auth.js"

# Set content types for better performance
echo "🔧 Setting content types..."
aws s3 cp "s3://$BUCKET_NAME" "s3://$BUCKET_NAME" \
    --recursive \
    --metadata-directive REPLACE \
    --content-type "text/html" \
    --exclude "*" \
    --include "*.html" \
    --profile $PROFILE

aws s3 cp "s3://$BUCKET_NAME" "s3://$BUCKET_NAME" \
    --recursive \
    --metadata-directive REPLACE \
    --content-type "text/css" \
    --exclude "*" \
    --include "*.css" \
    --profile $PROFILE

aws s3 cp "s3://$BUCKET_NAME" "s3://$BUCKET_NAME" \
    --recursive \
    --metadata-directive REPLACE \
    --content-type "application/javascript" \
    --exclude "*" \
    --include "*.js" \
    --profile $PROFILE

# Get website URL
WEBSITE_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

echo ""
echo "✅ Deployment complete!"
echo "🌐 Website URL: $WEBSITE_URL"
echo ""
echo "📝 Next steps:"
echo "   1. Test the website at the URL above"
echo "   2. Consider setting up CloudFront for better performance"
echo "   3. Configure a custom domain if needed"
echo ""
echo "⚠️  Note: This is the static version without live JIRA integration"
echo "   Update static/jira-tickets.json manually for ticket updates"
