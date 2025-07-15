#!/bin/bash

# Avahi Dashboard - AWS Parameter Store Setup Script
# This script securely stores JIRA credentials in AWS Systems Manager Parameter Store

set -e  # Exit on any error

# Configuration
PROFILE="default"  # Change to your AWS profile name
REGION="us-east-1"

echo "🔐 Setting up AWS Parameter Store for JIRA credentials..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Function to prompt for input with validation
prompt_for_input() {
    local prompt="$1"
    local var_name="$2"
    local is_secret="$3"
    
    while true; do
        if [ "$is_secret" = "true" ]; then
            echo -n "$prompt: "
            read -s input
            echo  # New line after hidden input
        else
            echo -n "$prompt: "
            read input
        fi
        
        if [ -n "$input" ]; then
            eval "$var_name='$input'"
            break
        else
            echo "❌ This field cannot be empty. Please try again."
        fi
    done
}

# Get JIRA credentials from user
echo "📝 Please provide your JIRA credentials:"
echo "   (These will be securely stored in AWS Parameter Store)"
echo ""

prompt_for_input "JIRA Email Address" "JIRA_EMAIL" "false"
prompt_for_input "JIRA API Token" "JIRA_TOKEN" "true"

echo ""
echo "🔍 Validating credentials..."

# Test JIRA connection
echo "Testing connection to JIRA..."
AUTH_HEADER=$(echo -n "$JIRA_EMAIL:$JIRA_TOKEN" | base64)
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Basic $AUTH_HEADER" \
    -H "Accept: application/json" \
    "https://sgkservices.atlassian.net/rest/api/3/myself")

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ JIRA credentials validated successfully"
else
    echo "❌ JIRA credential validation failed (HTTP $HTTP_STATUS)"
    echo "   Please check your email and API token and try again"
    exit 1
fi

echo ""
echo "💾 Storing credentials in AWS Parameter Store..."

# Store JIRA email (non-encrypted)
aws ssm put-parameter \
    --name "/avahi/jira/email" \
    --value "$JIRA_EMAIL" \
    --type "String" \
    --description "JIRA email address for Avahi Dashboard" \
    --overwrite \
    --profile $PROFILE \
    --region $REGION

echo "✅ Stored JIRA email parameter"

# Store JIRA API token (encrypted)
aws ssm put-parameter \
    --name "/avahi/jira/token" \
    --value "$JIRA_TOKEN" \
    --type "SecureString" \
    --description "JIRA API token for Avahi Dashboard" \
    --overwrite \
    --profile $PROFILE \
    --region $REGION

echo "✅ Stored JIRA API token parameter (encrypted)"

# Store additional configuration parameters
aws ssm put-parameter \
    --name "/avahi/jira/base-url" \
    --value "https://sgkservices.atlassian.net" \
    --type "String" \
    --description "JIRA base URL for Avahi Dashboard" \
    --overwrite \
    --profile $PROFILE \
    --region $REGION

echo "✅ Stored JIRA base URL parameter"

aws ssm put-parameter \
    --name "/avahi/jira/project-key" \
    --value "SD" \
    --type "String" \
    --description "JIRA project key for Avahi Dashboard" \
    --overwrite \
    --profile $PROFILE \
    --region $REGION

echo "✅ Stored JIRA project key parameter"

echo ""
echo "🔒 Setting up IAM role for EC2 instance..."

# Create IAM policy for Parameter Store access
cat > avahi-parameter-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ssm:GetParameter",
                "ssm:GetParameters",
                "ssm:GetParametersByPath"
            ],
            "Resource": [
                "arn:aws:ssm:$REGION:*:parameter/avahi/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "kms:Decrypt"
            ],
            "Resource": [
                "arn:aws:kms:$REGION:*:key/*"
            ],
            "Condition": {
                "StringEquals": {
                    "kms:ViaService": "ssm.$REGION.amazonaws.com"
                }
            }
        }
    ]
}
EOF

# Create IAM policy
POLICY_ARN=$(aws iam create-policy \
    --policy-name "AvahiDashboardParameterAccess" \
    --policy-document file://avahi-parameter-policy.json \
    --description "Allows Avahi Dashboard to access Parameter Store" \
    --profile $PROFILE \
    --output text \
    --query 'Policy.Arn' 2>/dev/null || \
    aws iam list-policies \
    --query "Policies[?PolicyName=='AvahiDashboardParameterAccess'].Arn" \
    --output text \
    --profile $PROFILE)

echo "✅ Created/found IAM policy: $POLICY_ARN"

# Create IAM role for EC2
cat > avahi-trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

# Create IAM role
aws iam create-role \
    --role-name "AvahiDashboardRole" \
    --assume-role-policy-document file://avahi-trust-policy.json \
    --description "IAM role for Avahi Dashboard EC2 instance" \
    --profile $PROFILE 2>/dev/null || echo "Role already exists"

echo "✅ Created/found IAM role: AvahiDashboardRole"

# Attach policy to role
aws iam attach-role-policy \
    --role-name "AvahiDashboardRole" \
    --policy-arn "$POLICY_ARN" \
    --profile $PROFILE

echo "✅ Attached policy to role"

# Create instance profile
aws iam create-instance-profile \
    --instance-profile-name "AvahiDashboardInstanceProfile" \
    --profile $PROFILE 2>/dev/null || echo "Instance profile already exists"

# Add role to instance profile
aws iam add-role-to-instance-profile \
    --instance-profile-name "AvahiDashboardInstanceProfile" \
    --role-name "AvahiDashboardRole" \
    --profile $PROFILE 2>/dev/null || echo "Role already in instance profile"

echo "✅ Created instance profile: AvahiDashboardInstanceProfile"

# Clean up temporary files
rm avahi-parameter-policy.json avahi-trust-policy.json

echo ""
echo "🎉 AWS Parameter Store setup complete!"
echo ""
echo "📋 Summary of created resources:"
echo "   • Parameter: /avahi/jira/email"
echo "   • Parameter: /avahi/jira/token (encrypted)"
echo "   • Parameter: /avahi/jira/base-url"
echo "   • Parameter: /avahi/jira/project-key"
echo "   • IAM Policy: AvahiDashboardParameterAccess"
echo "   • IAM Role: AvahiDashboardRole"
echo "   • Instance Profile: AvahiDashboardInstanceProfile"
echo ""
echo "📝 Next steps:"
echo "   1. When launching EC2 instance, attach the 'AvahiDashboardInstanceProfile'"
echo "   2. Use the secure-production-server.js for your application"
echo "   3. Set NODE_ENV=production environment variable"
echo ""
echo "🔄 To verify parameters were stored correctly:"
echo "   aws ssm get-parameter --name '/avahi/jira/email' --profile $PROFILE"
echo "   aws ssm get-parameter --name '/avahi/jira/token' --with-decryption --profile $PROFILE"
