# Jira Integration Setup Instructions

This guide will help you set up live Jira integration using personal access tokens for the Avahi Support Dashboard.

## Prerequisites

- Access to your organization's Jira instance
- Permission to create personal access tokens (most users have this)
- Basic understanding of your Jira project structure

## Step 1: Create a Jira Personal Access Token

1. **Log into SGK Services Jira** at https://sgkservices.atlassian.net

2. **Navigate to your profile settings**:
   - Click your profile picture in the top-right corner
   - Select "Account settings" or "Profile"

3. **Go to Security settings**:
   - Look for "Security" in the left sidebar
   - Click on "Create and manage API tokens"

4. **Create a new token**:
   - Click "Create API token"
   - Give it a descriptive name like "Avahi Dashboard Integration"
   - Click "Create"
   - **IMPORTANT**: Copy the token immediately - you won't be able to see it again!

## Step 2: Configure the Dashboard

1. **Open the configuration file**:
   ```
   avahi_dashboard/config/jira-config.js
   ```

2. **Update the configuration**:
   ```javascript
   const JIRA_CONFIG = {
       // SGK Services Jira instance URL (already configured)
       baseUrl: 'https://sgkservices.atlassian.net',
       
       // Your SGK Services email address
       email: 'your.email@sgkservices.com',  // Update with your email
       
       // The personal access token you just created
       apiToken: 'ATATT3xFfGF0T4JVjdmn7...',  // Paste your token here
       
       // Service Desk project key (already configured)
       projectKey: 'SD',
       
       // JQL query for Service Desk tickets (already configured)
       jqlQuery: 'project = SD AND status != Done ORDER BY priority DESC, updated DESC',
       
       // Maximum number of tickets to display
       maxResults: 10,
       
       // Auto-refresh interval (5 minutes = 300000 milliseconds)
       refreshInterval: 300000,
       
       // Enable the integration
       enabled: true  // Change this to true!
   };
   ```

3. **Customize the JQL query** (optional):
   - The `jqlQuery` field allows you to filter Service Desk tickets
   - Examples for SGK Service Desk:
     ```javascript
     // Show only high priority tickets
     jqlQuery: 'project = SD AND priority = High ORDER BY updated DESC'
     
     // Show tickets assigned to specific people
     jqlQuery: 'project = SD AND assignee in (currentUser(), "john.doe@sgkservices.com") ORDER BY updated DESC'
     
     // Show tickets updated in the last 7 days
     jqlQuery: 'project = SD AND updated >= -7d ORDER BY updated DESC'
     
     // Show only tickets from specific queue (if you know the queue ID)
     jqlQuery: 'project = SD AND "Customer Request Type" = "Infrastructure Support" ORDER BY updated DESC'
     ```

## Step 3: Test the Integration

1. **Save your configuration** and refresh the dashboard

2. **Check the status indicator**:
   - Look for the status indicator next to the "Recent Tickets" section
   - 🟢 Green dot = Connected and working
   - 🔴 Red dot = Connection failed
   - ⚫ Gray dot = Integration disabled

3. **Test the refresh button**:
   - Click the refresh button (🔄) next to "Recent Tickets"
   - The button should spin and new data should load

4. **Check the browser console**:
   - Press F12 to open developer tools
   - Look for any error messages in the Console tab

## Troubleshooting

### Common Issues

**❌ "HTTP error! status: 401"**
- Your email or API token is incorrect
- Double-check both values in the config

**❌ "HTTP error! status: 403"**
- You don't have permission to access the project
- Ask your Jira admin to grant you access

**❌ "HTTP error! status: 400"**
- Your JQL query is invalid
- Test your JQL in Jira's search interface first

**❌ CORS errors**
- This is expected when opening the HTML file directly
- Use the local server: `python -m http.server 8000`

### Testing Your Configuration

You can test your Jira connection manually:

1. **Open browser developer tools** (F12)
2. **Go to the Console tab**
3. **Run this test**:
   ```javascript
   // Test your connection to SGK Services
   const testConfig = {
       baseUrl: 'https://sgkservices.atlassian.net',
       email: 'your.email@sgkservices.com',
       apiToken: 'your-token-here'
   };
   
   const credentials = btoa(`${testConfig.email}:${testConfig.apiToken}`);
   
   fetch(`${testConfig.baseUrl}/rest/api/3/myself`, {
       headers: {
           'Authorization': `Basic ${credentials}`,
           'Accept': 'application/json'
       }
   })
   .then(response => response.json())
   .then(data => console.log('Success:', data))
   .catch(error => console.error('Error:', error));
   ```

## Security Considerations

### 🔒 Important Security Notes

1. **Never commit your API token to version control**
   - Add `config/jira-config.js` to your `.gitignore` file
   - Consider using environment variables for production

2. **Rotate your tokens regularly**
   - Create new tokens every 90 days
   - Revoke old tokens when no longer needed

3. **Use minimal permissions**
   - The integration only needs read access to tickets
   - Don't use admin accounts for this integration

### Production Deployment

For production environments, consider:

1. **Environment variables**:
   ```javascript
   const JIRA_CONFIG = {
       baseUrl: process.env.JIRA_BASE_URL || 'https://sgkservices.atlassian.net',
       email: process.env.JIRA_EMAIL || 'your.email@sgkservices.com',
       apiToken: process.env.JIRA_API_TOKEN || 'fallback-token',
       // ... rest of config
   };
   ```

2. **Server-side proxy**:
   - Route Jira requests through your backend
   - Keep credentials on the server side
   - Avoid CORS issues

## Features

### Auto-refresh
- Tickets automatically refresh every 5 minutes (configurable)
- Manual refresh button available
- Graceful fallback to cached data if Jira is unavailable

### Status Indicators
- Real-time connection status
- Last update timestamp
- Error notifications with helpful messages

### Ticket Display
- Priority-based color coding
- Clickable ticket links
- Assignee and update information
- Status badges

## Support

If you encounter issues:

1. **Check the browser console** for error messages
2. **Verify your Jira permissions** - can you access the project in Jira directly?
3. **Test your JQL query** in Jira's search interface
4. **Contact your Jira administrator** if you need additional permissions

## Advanced Configuration

### Custom Fields
To display additional Jira fields, modify the `fields` parameter in `jira-service.js`:

```javascript
const params = new URLSearchParams({
    jql: jql,
    maxResults: this.config.maxResults || 10,
    fields: 'key,summary,status,priority,assignee,updated,created,issuetype,customfield_10001'
});
```

### Custom Styling
Ticket priorities and statuses can be styled in `css/styles.css`:

```css
.ticket-item.critical-priority {
    border-left-color: #ff0000;
    background-color: #fff5f5;
}
```

This integration provides a robust, secure way to display live Jira data in your dashboard while maintaining good security practices.
