# Avahi Dashboard - Production Deployment Checklist

## Pre-Deployment Security Checklist

### Code Security
- [ ] Removed all testing files (`test-jira.js`, `debug-auth.js`)
- [ ] Removed development proxy server (`proxy-server.js`)
- [ ] Cleaned JIRA configuration - no hardcoded credentials
- [ ] Added `.gitignore` to prevent sensitive files from being committed
- [ ] Verified no API tokens or passwords in any files

### Configuration Review
- [ ] Updated `config/jira-config.js` to use secure credential management
- [ ] Verified all file paths are correct for production
- [ ] Checked that all static assets are properly referenced
- [ ] Confirmed CORS settings are appropriate for production domain

### AWS Prerequisites
- [ ] AWS CLI installed and configured with SGK-MAIN account
- [ ] Appropriate IAM permissions for deployment
- [ ] Decided on deployment option (S3 Static vs EC2 vs Serverless)

## Deployment Options

### Option 1: EC2 Full Application (Live JIRA) - RECOMMENDED
**Estimated Time**: 45 minutes  
**Cost**: $20-40/month  
**JIRA Integration**: **FULLY AUTOMATIC - NO MANUAL INTERVENTION REQUIRED**

### Option 2: S3 Static Hosting - NOT RECOMMENDED
**Estimated Time**: 15 minutes  
**Cost**: $5-15/month  
**JIRA Integration**: Manual updates required

#### Steps:
- [ ] Run `chmod +x deploy-scripts/deploy-s3-static.sh`
- [ ] Execute `./deploy-scripts/deploy-s3-static.sh`
- [ ] Test the S3 website URL
- [ ] (Optional) Run `./deploy-scripts/setup-cloudfront.sh` for CDN
- [ ] Update DNS if using custom domain

#### Post-Deployment:
- [ ] Test all dashboard functionality
- [ ] Verify team information displays correctly
- [ ] Check shift schedule accuracy
- [ ] Confirm static JIRA tickets load properly
- [ ] Set up process for manual JIRA ticket updates (ongoing maintenance required)

#### Prerequisites:
- [ ] Run `chmod +x deploy-scripts/setup-aws-parameters.sh`
- [ ] Execute `./deploy-scripts/setup-aws-parameters.sh`
- [ ] Launch EC2 instance (t3.micro recommended)
- [ ] Attach `AvahiDashboardInstanceProfile` IAM role to EC2

#### Deployment Steps:
- [ ] SSH into EC2 instance
- [ ] Install Node.js: `sudo yum update -y && sudo yum install -y nodejs npm git`
- [ ] Create app directory: `sudo mkdir -p /opt/avahi-dashboard`
- [ ] Set permissions: `sudo chown ec2-user:ec2-user /opt/avahi-dashboard`
- [ ] Upload production files to EC2
- [ ] Install dependencies: `npm install`
- [ ] Install PM2: `sudo npm install -g pm2`
- [ ] Start application: `pm2 start ecosystem.config.js --env production`
- [ ] Configure PM2 startup: `pm2 startup && pm2 save`

#### Post-Deployment:
- [ ] Test health endpoint: `curl http://your-server/health`
- [ ] Verify live JIRA integration works automatically
- [ ] Check PM2 process status: `pm2 status`
- [ ] Test all dashboard features
- [ ] Confirm JIRA tickets update automatically every 5 minutes
- [ ] Set up monitoring and alerting
- [ ] No manual JIRA maintenance required!

### Option 3: Serverless (Lambda + API Gateway)
**Estimated Time**: 60 minutes  
**Cost**: $5-10/month  
**JIRA Integration**: Live API integration

#### Steps:
- [ ] Follow AWS SAM/CDK deployment guide in AWS_HOSTING_GUIDE.md
- [ ] Deploy Lambda function for JIRA proxy
- [ ] Set up API Gateway
- [ ] Deploy static files to S3
- [ ] Configure CloudFront distribution

## Security Verification

### Credential Security
- [ ] No hardcoded passwords or API tokens in any file
- [ ] JIRA credentials stored in AWS Parameter Store (encrypted)
- [ ] IAM roles follow principle of least privilege
- [ ] Security groups properly configured

### Network Security
- [ ] HTTPS enabled (CloudFront or ALB)
- [ ] Proper CORS configuration
- [ ] Security headers implemented
- [ ] Access logging enabled

### Monitoring Setup
- [ ] CloudWatch logging configured
- [ ] Health check endpoints working
- [ ] Error alerting set up
- [ ] Cost monitoring enabled

## Post-Deployment Testing

### Functionality Tests
- [ ] Dashboard loads without errors
- [ ] Team directory displays correctly
- [ ] Current shift information accurate
- [ ] Weekly schedule shows properly
- [ ] JIRA tickets load (live or static)
- [ ] All links and buttons work
- [ ] Mobile responsiveness verified

### Performance Tests
- [ ] Page load time acceptable (<3 seconds)
- [ ] Images load properly
- [ ] No console errors in browser
- [ ] API responses within acceptable time

### Security Tests
- [ ] No sensitive information exposed in browser
- [ ] HTTPS working properly
- [ ] No mixed content warnings
- [ ] API endpoints properly secured

## Maintenance Setup

### Regular Updates
- [ ] Process documented for updating team information
- [ ] Shift schedule update procedure established
- [ ] JIRA ticket refresh process (if static)
- [ ] Application update deployment process

### Backup and Recovery
- [ ] Static files backed up
- [ ] Configuration documented
- [ ] Recovery procedures tested
- [ ] Contact information for support

### Documentation
- [ ] Deployment process documented
- [ ] Team trained on updates
- [ ] Troubleshooting guide available
- [ ] Contact information updated

## Final Verification

### Production Readiness
- [ ] All tests passed
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Monitoring active
- [ ] Team trained
- [ ] Documentation complete

### Go-Live
- [ ] DNS updated (if applicable)
- [ ] Team notified of new URL
- [ ] Old system decommissioned (if applicable)
- [ ] Success metrics defined
- [ ] Support process established

---

## Emergency Contacts

**AWS Support**: Your AWS support contact  
**Infrastructure Team**: jason.french@sgkinc.com  
**JIRA Admin**: Your JIRA administrator  

## Rollback Plan

In case of issues:
1. **S3 Static**: Revert to previous S3 version
2. **EC2**: Stop PM2 process, restore previous version
3. **DNS**: Update DNS back to previous system
4. **Emergency**: Contact infrastructure team immediately

---

**Deployment Date**: ___________  
**Deployed By**: ___________  
**Version**: 1.0.0  
**Environment**: Production
