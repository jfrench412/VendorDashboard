# Avahi Support Dashboard - Production Ready

A comprehensive support team dashboard for the Avahi team, designed for deployment in AWS infrastructure with secure JIRA integration.

## Project Structure

```
├── avahi_dashboard/              # Main application files
│   ├── index.html               # Dashboard homepage
│   ├── package.json             # Application metadata
│   ├── config/
│   │   └── jira-config.js       # JIRA configuration (production-ready)
│   ├── css/
│   │   └── styles.css           # Dashboard styling
│   ├── js/
│   │   ├── dashboard.js         # Main dashboard functionality
│   │   └── jira-service.js      # JIRA API integration
│   ├── assets/
│   │   └── profile-pics/        # Team member photos
│   └── static/
│       ├── team.json            # Team member information
│       ├── shifts.csv           # Shift schedule data
│       └── jira-tickets.json    # Static JIRA ticket data
├── deploy-scripts/              # AWS deployment automation
│   ├── deploy-s3-static.sh      # S3 static hosting deployment
│   ├── setup-cloudfront.sh      # CloudFront CDN setup
│   ├── setup-aws-parameters.sh  # Secure credential storage
│   ├── secure-production-server.js # Production Node.js server
│   ├── package.json             # Production dependencies
│   ├── ecosystem.config.js      # PM2 process manager config
│   └── README.md                # Deployment instructions
├── AWS_HOSTING_GUIDE.md         # Comprehensive hosting guide
├── PRODUCTION_DEPLOYMENT_CHECKLIST.md # Deployment checklist
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

## Quick Start - LIVE JIRA INTEGRATION (Recommended)

### Automated Deployment with Live JIRA Updates
```bash
cd deploy-scripts
chmod +x setup-aws-parameters.sh
./setup-aws-parameters.sh
# Then follow EC2 deployment steps in deploy-scripts/README.md
```

**Note**: This setup provides fully automatic JIRA ticket updates with no manual intervention required.

## Security Features

- **No hardcoded credentials** - All sensitive data stored in AWS Parameter Store
- **Clean codebase** - Removed all testing and debug files
- **Production-ready configuration** - Secure JIRA integration
- **Proper .gitignore** - Prevents accidental credential commits
- **IAM roles** - Minimal permissions following AWS best practices

## Features

- **Team Directory**: Display team members with photos and contact info
- **Current Shift Status**: Real-time indication of who's working now
- **Weekly Schedule**: Full week view of all shifts
- **JIRA Integration**: Live ticket updates (with secure deployment) or static data
- **Responsive Design**: Works on desktop and mobile devices
- **Timezone Support**: EST and UK time displays

## Deployment Options

| Option | Cost/Month | Complexity | JIRA Integration | Setup Time | Recommended |
|--------|------------|------------|------------------|------------|-------------|
| **EC2 Full** | $20-40 | Medium | **Fully Automatic** | 45 min | **YES** |
| Serverless | $5-10 | High | **Fully Automatic** | 60 min | Alternative |
| S3 Static | $5-15 | Low | Manual updates only | 15 min | Not recommended |

**For your requirements, use EC2 Full deployment for reliable automatic JIRA integration.**

## Documentation

- **[AWS_HOSTING_GUIDE.md](AWS_HOSTING_GUIDE.md)** - Complete hosting strategy and architecture
- **[deploy-scripts/README.md](deploy-scripts/README.md)** - Step-by-step deployment instructions
- **[PRODUCTION_DEPLOYMENT_CHECKLIST.md](PRODUCTION_DEPLOYMENT_CHECKLIST.md)** - Pre-deployment security checklist
- **[avahi_dashboard/DASHBOARD_INSTRUCTIONS.md](avahi_dashboard/DASHBOARD_INSTRUCTIONS.md)** - Dashboard usage and maintenance

## Configuration

### JIRA Configuration
The `config/jira-config.js` file is production-ready with:
- No hardcoded credentials
- Secure parameter references
- Environment-specific settings
- Clear documentation

### Team Information
Update team details in:
- `static/team.json` - Team member information
- `static/shifts.csv` - Shift schedules
- `assets/profile-pics/` - Team photos

## Important Security Notes

1. **Never commit credentials** to version control
2. **Use AWS Parameter Store** for sensitive configuration
3. **Follow the deployment checklist** before going live
4. **Regularly rotate JIRA API tokens**
5. **Monitor access logs** for suspicious activity

## Support

- **Infrastructure Team**: jason.french@sgkinc.com
- **Deployment Issues**: Check troubleshooting in deploy-scripts/README.md
- **AWS Support**: Contact your AWS administrator

## Updates and Maintenance

### Regular Updates
- Team information: Edit `static/team.json`
- Shift schedules: Update `static/shifts.csv`
- JIRA tickets (static): Modify `static/jira-tickets.json`

### Application Updates
- Static deployment: Re-run `deploy-s3-static.sh`
- EC2 deployment: Use PM2 restart process
- Always test in staging first

## Monitoring

- **Health checks**: `/health` endpoint (EC2 deployment)
- **Logs**: PM2 logs or CloudWatch
- **Performance**: Monitor page load times
- **Costs**: Use AWS Cost Explorer

## Next Steps

1. **Choose deployment option** based on your needs
2. **Follow the deployment checklist** for security
3. **Test thoroughly** before going live
4. **Set up monitoring** and alerting
5. **Train team** on maintenance procedures

---

**Version**: 1.0.0  
**Last Updated**: July 2025  
**Environment**: Production Ready  
**AWS Account**: SGK-MAIN
