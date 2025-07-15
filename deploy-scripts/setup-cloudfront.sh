#!/bin/bash

# Avahi Dashboard - CloudFront Setup Script
# This script creates a CloudFront distribution for the S3-hosted dashboard

set -e  # Exit on any error

# Configuration
BUCKET_NAME="avahi-dashboard-sgk-main"
REGION="us-east-1"
PROFILE="default"  # Change to your AWS profile name

echo "☁️ Setting up CloudFront distribution..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Get S3 website endpoint
S3_WEBSITE_ENDPOINT="$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

echo "📋 Creating CloudFront distribution configuration..."

# Create CloudFront distribution configuration
cat > cloudfront-config.json << EOF
{
  "CallerReference": "avahi-dashboard-$(date +%s)",
  "Comment": "Avahi Support Dashboard CloudFront Distribution",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-$BUCKET_NAME",
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "Compress": true
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-$BUCKET_NAME",
        "DomainName": "$S3_WEBSITE_ENDPOINT",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "PriceClass": "PriceClass_100"
}
EOF

echo "🚀 Creating CloudFront distribution..."
DISTRIBUTION_OUTPUT=$(aws cloudfront create-distribution \
    --distribution-config file://cloudfront-config.json \
    --profile $PROFILE \
    --output json)

# Extract distribution ID and domain name
DISTRIBUTION_ID=$(echo $DISTRIBUTION_OUTPUT | jq -r '.Distribution.Id')
CLOUDFRONT_DOMAIN=$(echo $DISTRIBUTION_OUTPUT | jq -r '.Distribution.DomainName')

# Clean up temporary file
rm cloudfront-config.json

echo ""
echo "✅ CloudFront distribution created successfully!"
echo "🆔 Distribution ID: $DISTRIBUTION_ID"
echo "🌐 CloudFront URL: https://$CLOUDFRONT_DOMAIN"
echo ""
echo "⏳ Note: It may take 15-20 minutes for the distribution to be fully deployed"
echo ""
echo "📝 Next steps:"
echo "   1. Wait for distribution status to change from 'InProgress' to 'Deployed'"
echo "   2. Test the CloudFront URL: https://$CLOUDFRONT_DOMAIN"
echo "   3. Consider setting up a custom domain with Route 53"
echo ""
echo "🔄 To check deployment status:"
echo "   aws cloudfront get-distribution --id $DISTRIBUTION_ID --profile $PROFILE --query 'Distribution.Status'"
echo ""
echo "💾 Save this information:"
echo "   Distribution ID: $DISTRIBUTION_ID"
echo "   CloudFront Domain: $CLOUDFRONT_DOMAIN"
