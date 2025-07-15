# Avahi Dashboard - AWS Deployment Scripts

This directory contains all the scripts and configuration files needed to deploy the Avahi Support Dashboard to your AWS SGK-MAIN account.

## Quick Start - AUTOMATIC JIRA INTEGRATION

### Recommended: Full Application with Live JIRA Integration
```bash
# 1. Make scripts executable
chmod +x setup-aws-parameters.sh

# 2. Set up secure credential storage
./setup-aws-parameters.sh

# 3. Launch EC2 instance with the created IAM role
# 4. Deploy the production server (see EC2 Deployment section below)
```

**This provides fully automatic JIRA ticket updates with no manual intervention required.**

### Alternative: Static Hosting (Manual JIRA updates only)
```bash
# Only use this if you want to manually update JIRA tickets
chmod +x deploy-s3-static.sh setup-cloudfront.sh
./deploy-s3-static.sh
./setup-cloudfront.sh  # Optional CDN
```

## Files Overview

| File | Purpose |
|------|---------|
| `deploy-s3-static.sh` | Deploy static version to S3 |
| `setup-cloudfront.sh` | Create CloudFront distribution |
| `setup-aws-parameters.sh` | Store JIRA credentials securely |
| `secure-production-server.js` | Production Node.js server |
| `package.json` | Node.js dependencies |
| `ecosystem.config.js` | PM2 process manager config |

## Deployment Options

### EC2 Hosting (Full Functionality) - RECOMMENDED
**Cost**: ~$20-40/month | **Complexity**: Medium | **JIRA**: **FULLY AUTOMATIC**

### Static Hosting (S3 + CloudFront) - Not Recommended
**Cost**: ~$5-15/month | **Complexity**: Low | **JIRA**: Manual updates required

1. Run `./deploy-s3-static.sh`
2. Optionally run `./setup-cloudfront.sh` for better performance
3. Requires manual updates to `static/jira-tickets.json` for ticket changes

#### Prerequisites
1. Run `./setup-aws-parameters.sh` to store credentials
2. Launch EC2 instance (t3.micro recommended)
3. Attach `AvahiDashboardInstanceProfile` IAM role

#### EC2 Deployment Steps
```bash
# On your EC2 instance:

# 1. Install Node.js and dependencies
sudo yum update -y
sudo yum install -y nodejs npm git

# 2. Create application directory
sudo mkdir -p /opt/avahi-dashboard
sudo chown ec2-user:ec2-user /opt/avahi-dashboard
cd /opt/avahi-dashboard

# 3. Copy deployment files
# Upload: secure-production-server.js, package.json, ecosystem.config.js
# Upload: entire avahi_dashboard/ directory

# 4. Install dependencies
npm install

# 5. Install PM2 globally
sudo npm install -g pm2

# 6. Create logs directory
mkdir -p logs

# 7. Start application
pm2 start ecosystem.config.js --env production

# 8. Set up PM2 to start on boot
pm2 startup
pm2 save

# 9. Configure firewall (if needed)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload
```

## Configuration

### Environment Variables
Set these on your EC2 instance:
```bash
export NODE_ENV=production
export PORT=80
export AWS_REGION=us-east-1
```

### AWS Profile Configuration
Update the `PROFILE` variable in scripts to match your AWS CLI profile:
```bash
# In deploy-s3-static.sh and setup-cloudfront.sh
PROFILE="your-aws-profile-name"
```

### Custom Domain Setup
To use a custom domain:

1. **Purchase/configure domain in Route 53**
2. **Request SSL certificate in ACM**
3. **Update CloudFront distribution** to use custom domain
4. **Create Route 53 alias record** pointing to CloudFront

## Security Considerations

### Credential Management
- JIRA credentials stored in AWS Parameter Store (encrypted)
- IAM roles with minimal permissions
- No hardcoded secrets in code
- Remove API tokens from `config/jira-config.js` before deployment

### Network Security
- Configure Security Groups to allow only necessary ports
- Consider using VPC for internal-only access
- Enable CloudTrail for audit logging

### Access Control
- Use IAM roles instead of access keys
- Regularly rotate JIRA API tokens
- Monitor CloudWatch logs for suspicious activity

## Monitoring and Maintenance

### Health Checks
```bash
# Check application health
curl http://your-domain/health

# Check PM2 status
pm2 status

# View logs
pm2 logs avahi-dashboard
```

### Updates and Maintenance
```bash
# Update application
pm2 stop avahi-dashboard
# Upload new files
pm2 start ecosystem.config.js --env production

# Update static files only (S3)
./deploy-s3-static.sh

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

## Troubleshooting

### Common Issues

**S3 Deployment Fails**
- Check AWS CLI configuration: `aws configure list`
- Verify bucket name is globally unique
- Ensure proper IAM permissions

**JIRA Integration Not Working**
- Verify Parameter Store values: `aws ssm get-parameter --name '/avahi/jira/email'`
- Check EC2 instance has correct IAM role attached
- Test JIRA credentials manually

**EC2 Application Won't Start**
- Check Node.js version: `node --version` (should be ≥16)
- Verify all dependencies installed: `npm install`
- Check PM2 logs: `pm2 logs avahi-dashboard`

**CloudFront Not Updating**
- Create invalidation: `aws cloudfront create-invalidation --distribution-id ID --paths "/*"`
- Wait 15-20 minutes for distribution deployment

### Log Locations
- **PM2 Logs**: `./logs/` directory
- **CloudWatch**: EC2 instance logs (if configured)
- **S3 Access Logs**: Configure bucket logging if needed

## Cost Optimization

### S3 + CloudFront
- Use S3 Intelligent Tiering for infrequently accessed files
- Set CloudFront cache headers appropriately
- Monitor usage with AWS Cost Explorer

### EC2
- Use t3.micro for low traffic (free tier eligible)
- Consider Reserved Instances for long-term use
- Set up CloudWatch alarms for cost monitoring

## Support

For issues with deployment:
1. Check the troubleshooting section above
2. Review AWS CloudWatch logs
3. Verify IAM permissions and security groups
4. Contact your AWS administrator for account-specific issues

## Next Steps After Deployment

1. **Test all functionality** thoroughly
2. **Set up monitoring** and alerting
3. **Configure backups** for important data
4. **Document** your specific configuration
5. **Train team members** on maintenance procedures
