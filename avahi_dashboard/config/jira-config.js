// Jira Configuration - Production Ready
// This configuration is designed for production deployment with secure credential management

const JIRA_CONFIG = {
    // SGK Services Jira instance URL
    baseUrl: 'https://sgkservices.atlassian.net',
    
    // Service Desk project key
    projectKey: 'SD', // SGK Service Desk project
    
    // JQL query to filter tickets from Service Desk (exclude resolved/done tickets)
    jqlQuery: 'project = SD AND status NOT IN (Done, Resolved, Closed) ORDER BY created DESC',
    
    // Maximum number of tickets to fetch
    maxResults: 15,
    
    // Auto-refresh interval in milliseconds (5 minutes = 300000)
    refreshInterval: 300000,
    
    // Enable/disable live Jira integration
    // Set to false for static deployment, true for live integration
    enabled: true,
    
    // Production deployment notes:
    // - Email and API token should be stored in AWS Parameter Store
    // - Use the secure-production-server.js for production deployment
    // - Never commit credentials to version control
    
    // For local development only (remove in production):
    // Uncomment and set these for local testing, but remove before deployment
    /*
    email: 'your-email@sgkinc.com',
    apiToken: 'your-api-token-here'
    */
};

// Export for use in dashboard
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JIRA_CONFIG;
} else {
    window.JIRA_CONFIG = JIRA_CONFIG;
}
