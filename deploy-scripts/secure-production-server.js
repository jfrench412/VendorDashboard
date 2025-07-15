// Production Server for Avahi Dashboard with AWS Integration
// This replaces proxy-server.js for production deployment

const express = require('express');
const https = require('https');
const path = require('path');
const AWS = require('aws-sdk');
const cors = require('cors');

const app = express();

// Configure AWS SDK
AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1'
});

const ssm = new AWS.SSM();
const secretsManager = new AWS.SecretsManager();

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || (isProduction ? 80 : 3001);

// CORS configuration
const corsOptions = {
    origin: isProduction ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://your-domain.com'] : '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
};

app.use(cors(corsOptions));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../avahi_dashboard')));

// Cache for JIRA configuration
let jiraConfigCache = null;
let configCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to get JIRA configuration from AWS Parameter Store
async function getJiraConfig() {
    const now = Date.now();
    
    // Return cached config if still valid
    if (jiraConfigCache && (now - configCacheTime) < CACHE_DURATION) {
        return jiraConfigCache;
    }
    
    try {
        console.log('Fetching JIRA configuration from AWS Parameter Store...');
        
        const [emailParam, tokenParam] = await Promise.all([
            ssm.getParameter({ 
                Name: '/avahi/jira/email',
                WithDecryption: false 
            }).promise(),
            ssm.getParameter({ 
                Name: '/avahi/jira/token',
                WithDecryption: true 
            }).promise()
        ]);
        
        jiraConfigCache = {
            baseUrl: 'https://sgkservices.atlassian.net',
            email: emailParam.Parameter.Value,
            apiToken: tokenParam.Parameter.Value,
            projectKey: 'SD',
            jqlQuery: 'project = SD AND status NOT IN (Done, Resolved, Closed) ORDER BY created DESC',
            maxResults: 15
        };
        
        configCacheTime = now;
        console.log('JIRA configuration loaded successfully');
        return jiraConfigCache;
        
    } catch (error) {
        console.error('Error loading JIRA configuration:', error);
        
        // Fallback to environment variables if Parameter Store fails
        if (process.env.JIRA_EMAIL && process.env.JIRA_TOKEN) {
            console.log('Using fallback environment variables for JIRA config');
            return {
                baseUrl: 'https://sgkservices.atlassian.net',
                email: process.env.JIRA_EMAIL,
                apiToken: process.env.JIRA_TOKEN,
                projectKey: 'SD',
                jqlQuery: 'project = SD AND status NOT IN (Done, Resolved, Closed) ORDER BY created DESC',
                maxResults: 15
            };
        }
        
        throw new Error('Unable to load JIRA configuration from AWS or environment variables');
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// JIRA proxy endpoint
app.get('/jira-proxy/*', async (req, res) => {
    try {
        const config = await getJiraConfig();
        
        // Extract the JIRA API path from the request
        const jiraPath = req.path.replace('/jira-proxy', '');
        const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
        const jiraUrl = `${config.baseUrl}${jiraPath}${queryString}`;
        
        console.log(`Proxying request to: ${jiraUrl}`);
        
        // Create Basic Auth header
        const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
        
        // Make request to JIRA
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Avahi-Dashboard/1.0'
            }
        };
        
        const jiraReq = https.request(jiraUrl, options, (jiraRes) => {
            let data = '';
            
            jiraRes.on('data', (chunk) => {
                data += chunk;
            });
            
            jiraRes.on('end', () => {
                res.status(jiraRes.statusCode).json(JSON.parse(data));
            });
        });
        
        jiraReq.on('error', (error) => {
            console.error('Error proxying to JIRA:', error);
            res.status(500).json({ 
                error: 'JIRA proxy error', 
                message: error.message,
                timestamp: new Date().toISOString()
            });
        });
        
        jiraReq.setTimeout(10000, () => {
            jiraReq.destroy();
            res.status(504).json({ 
                error: 'JIRA request timeout',
                timestamp: new Date().toISOString()
            });
        });
        
        jiraReq.end();
        
    } catch (error) {
        console.error('Error in JIRA proxy:', error);
        res.status(500).json({ 
            error: 'Configuration error', 
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Serve the main application for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../avahi_dashboard/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    server.close(() => {
        console.log('Process terminated');
        process.exit(0);
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Avahi Dashboard server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    
    if (!isProduction) {
        console.log(`🌐 Dashboard: http://localhost:${PORT}`);
    }
});

module.exports = app;
