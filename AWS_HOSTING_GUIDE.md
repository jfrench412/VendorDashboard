# AWS Hosting Guide for Avahi Support Dashboard

## Application Architecture Analysis

Your application consists of:
- **Frontend**: Static HTML/CSS/JS dashboard
- **Backend**: Node.js proxy server for JIRA API integration
- **Data**: JSON/CSV files for team info and schedules
- **Assets**: Profile pictures and static resources

## Deployment Options

### Option 1: Full Application Hosting (EC2 + ALB) - RECOMMENDED FOR AUTOMATIC JIRA
**Best for**: Live JIRA integration, full functionality, zero manual intervention

#### Services Needed:
- **Amazon EC2**: Host Node.js proxy server
- **Application Load Balancer**: Route traffic
- **Amazon S3**: Store static assets
- **AWS Systems Manager**: Secure parameter storage
- **CloudWatch**: Monitoring and logs

#### Steps:
1. **Create S3 Bucket**
   ```bash
   # Bucket name should be unique globally
   aws s3 mb s3://avahi-dashboard-sgk-main --region us-east-1
   ```

2. **Configure S3 for Static Website Hosting**
   - Enable static website hosting
   - Set index document: `index.html`
   - Set error document: `index.html`

3. **Upload Files**
   ```bash
   aws s3 sync ./avahi_dashboard/ s3://avahi-dashboard-sgk-main --delete
   ```

4. **Set Bucket Policy** (for public access)
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::avahi-dashboard-sgk-main/*"
       }
     ]
   }
   ```

5. **Create CloudFront Distribution**
   - Origin: S3 bucket website endpoint
   - Enable HTTPS redirect
   - Set default root object: `index.html`

**Benefits**: Fully automatic JIRA ticket updates, no manual intervention required
**Cost**: ~$20-40/month

### Option 2: Simple Static Hosting (S3 + CloudFront) - NOT RECOMMENDED
**Best for**: Quick deployment, low cost, high availability
**Limitations**: No live JIRA integration (uses static JSON files), requires manual updates
**Cost**: ~$5-15/month depending on traffic

#### Services Needed:
- **Amazon EC2**: Host Node.js proxy server
- **Application Load Balancer**: Route traffic
- **Amazon S3**: Store static assets
- **AWS Systems Manager**: Secure parameter storage
- **CloudWatch**: Monitoring and logs

#### Architecture:
```
Internet → ALB → EC2 (Node.js) → JIRA API
                ↓
              S3 (Static Assets)
```

#### Steps:
1. **Launch EC2 Instance**
   - Instance type: t3.micro (sufficient for this workload)
   - AMI: Amazon Linux 2
   - Security group: Allow HTTP (80), HTTPS (443), SSH (22)

2. **Install Dependencies**
   ```bash
   sudo yum update -y
   sudo yum install -y nodejs npm git
   ```

3. **Deploy Application**
   ```bash
   git clone <your-repo>
   cd avahi_dashboard
   npm init -y
   npm install
   ```

4. **Configure Environment Variables**
   ```bash
   # Store sensitive data in Systems Manager Parameter Store
   aws ssm put-parameter --name "/avahi/jira/email" --value "jason.french@sgkinc.com" --type "String"
   aws ssm put-parameter --name "/avahi/jira/token" --value "YOUR_TOKEN" --type "SecureString"
   ```

5. **Create Production Server**
   ```javascript
   // server.js
   const express = require('express');
   const path = require('path');
   const AWS = require('aws-sdk');
   
   const app = express();
   const ssm = new AWS.SSM();
   
   // Serve static files
   app.use(express.static(path.join(__dirname)));
   
   // Your existing proxy logic here
   // But load credentials from SSM Parameter Store
   
   const PORT = process.env.PORT || 80;
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

6. **Set up Process Manager**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name avahi-dashboard
   pm2 startup
   pm2 save
   ```

**Cost**: ~$20-40/month

### Option 3: Serverless Architecture (Lambda + API Gateway + S3) - ALTERNATIVE
**Best for**: Scalability, cost optimization, AWS-native approach, automatic JIRA integration

#### Services Needed:
- **AWS Lambda**: Run proxy server logic
- **API Gateway**: Handle HTTP requests
- **Amazon S3**: Static website hosting
- **CloudFront**: CDN
- **AWS Secrets Manager**: Store JIRA credentials

#### Architecture:
```
CloudFront → S3 (Static Files)
           → API Gateway → Lambda → JIRA API
```

#### Steps:
1. **Create Lambda Function**
   ```javascript
   // lambda-proxy.js
   const https = require('https');
   const AWS = require('aws-sdk');
   
   exports.handler = async (event) => {
     // Your JIRA proxy logic here
     // Load credentials from Secrets Manager
     const secretsManager = new AWS.SecretsManager();
     const secret = await secretsManager.getSecretValue({
       SecretId: 'avahi/jira-credentials'
     }).promise();
     
     // Process JIRA request and return response
   };
   ```

2. **Deploy with SAM or CDK**
   ```yaml
   # template.yaml (SAM)
   AWSTemplateFormatVersion: '2010-09-09'
   Transform: AWS::Serverless-2016-10-31
   
   Resources:
     JiraProxyFunction:
       Type: AWS::Serverless::Function
       Properties:
         CodeUri: src/
         Handler: lambda-proxy.handler
         Runtime: nodejs18.x
         Events:
           JiraProxy:
             Type: Api
             Properties:
               Path: /jira-proxy/{proxy+}
               Method: ANY
   ```

**Cost**: ~$5-10/month (pay per use)

## Security Considerations

### 1. Credential Management
- **Never commit API tokens to code**
- Use AWS Systems Manager Parameter Store or Secrets Manager
- Rotate credentials regularly

### 2. Network Security
- Use Security Groups to restrict access
- Enable VPC if needed for internal access only
- Use WAF for additional protection

### 3. Access Control
- Set up IAM roles with minimal permissions
- Use CloudTrail for audit logging
- Consider IP whitelisting if internal-only

## Configuration Changes Needed

### 1. Update JIRA Configuration
```javascript
// config/jira-config.js - Production version
const AWS = require('aws-sdk');

const getJiraConfig = async () => {
  const ssm = new AWS.SSM();
  
  const [email, token] = await Promise.all([
    ssm.getParameter({ Name: '/avahi/jira/email' }).promise(),
    ssm.getParameter({ Name: '/avahi/jira/token', WithDecryption: true }).promise()
  ]);
  
  return {
    baseUrl: 'https://sgkservices.atlassian.net',
    email: email.Parameter.Value,
    apiToken: token.Parameter.Value,
    // ... rest of config
  };
};
```

### 2. Environment-Specific Settings
```javascript
// Add to your application
const isProduction = process.env.NODE_ENV === 'production';
const config = {
  port: process.env.PORT || (isProduction ? 80 : 3001),
  corsOrigin: isProduction ? 'https://your-domain.com' : '*'
};
```

## Deployment Automation

### 1. Create Deployment Script
```bash
#!/bin/bash
# deploy.sh

# Build and deploy to S3
aws s3 sync ./avahi_dashboard/ s3://avahi-dashboard-sgk-main --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo "Deployment complete!"
```

### 2. CI/CD Pipeline (Optional)
- Use AWS CodePipeline + CodeBuild
- Trigger on git commits
- Automated testing and deployment

## Cost Estimation

| Option | Monthly Cost | Pros | Cons |
|--------|-------------|------|------|
| S3 + CloudFront | $5-15 | Simple, fast, reliable | No live JIRA integration |
| EC2 + ALB | $20-40 | Full functionality | Requires maintenance |
| Serverless | $5-10 | Scalable, cost-effective | More complex setup |

## Recommended Implementation Plan

### Phase 1: Secure Setup (Day 1)
1. Run `setup-aws-parameters.sh` to store JIRA credentials securely
2. Launch EC2 instance with proper IAM role
3. Deploy production server with automatic JIRA integration

### Phase 2: Testing & Go-Live (Day 2)
1. Test all dashboard functionality including live JIRA updates
2. Set up monitoring and health checks
3. Configure custom domain if needed
4. Go live with fully automatic system

### Phase 3: Optimization (Ongoing)
1. Set up monitoring and alerts
2. Implement automated deployments
3. Add backup and disaster recovery

## Next Steps

1. **Choose deployment option** based on your requirements
2. **Set up AWS resources** in SGK-MAIN account
3. **Secure JIRA credentials** using AWS services
4. **Test deployment** in staging environment
5. **Monitor and maintain** the application

Would you like me to help you implement any of these options or create specific deployment scripts?
