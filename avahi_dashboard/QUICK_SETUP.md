# 🚀 Quick Jira Setup for SGK Services

## Step 1: Get Your API Token
1. Go to https://sgkservices.atlassian.net
2. Click your profile → Account settings → Security → Create API token
3. Name it "Avahi Dashboard" and copy the token

## Step 2: Configure Dashboard
Edit `config/jira-config.js`:

```javascript
const JIRA_CONFIG = {
    baseUrl: 'https://sgkservices.atlassian.net',
    email: 'YOUR_EMAIL@sgkservices.com',        // ← Update this
    apiToken: 'YOUR_API_TOKEN_HERE',            // ← Paste token here
    projectKey: 'SD',
    jqlQuery: 'project = SD AND status != Done ORDER BY priority DESC, updated DESC',
    maxResults: 10,
    refreshInterval: 300000,
    enabled: true                               // ← Change to true
};
```

## Step 3: Test
1. Save the file
2. Refresh the dashboard
3. Look for 🟢 green dot next to "Recent Tickets"
4. Click refresh button to test

## ✅ You're Done!
- Tickets auto-refresh every 5 minutes
- Manual refresh button available
- Fallback to static data if connection fails

## 🔧 Troubleshooting
- **401 Error**: Check email/token
- **403 Error**: Ask admin for SD project access
- **CORS Error**: Use `python -m http.server 8000`

## 🔒 Security
- Never commit your token to git
- Rotate tokens every 90 days
- Only needs read access to Service Desk
