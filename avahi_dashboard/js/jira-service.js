// Jira API Service
class JiraService {
    constructor(config) {
        this.config = config;
        this.cache = null;
        this.lastFetch = null;
        this.refreshTimer = null;
    }

    // Initialize the service and start auto-refresh
    init() {
        if (!this.config.enabled) {
            console.log('Jira integration is disabled');
            return;
        }

        if (!this.validateConfig()) {
            console.error('Jira configuration is invalid');
            return;
        }

        // Initial fetch
        this.fetchTickets();

        // Set up auto-refresh
        if (this.config.refreshInterval > 0) {
            this.refreshTimer = setInterval(() => {
                this.fetchTickets();
            }, this.config.refreshInterval);
        }
    }

    // Validate configuration
    validateConfig() {
        const required = ['baseUrl', 'email', 'apiToken'];
        for (const field of required) {
            if (!this.config[field] || this.config[field].includes('YOUR_') || this.config[field].includes('your-')) {
                console.error(`Jira config missing or invalid: ${field}`);
                return false;
            }
        }
        return true;
    }

    // Create authorization header
    getAuthHeader() {
        const credentials = btoa(`${this.config.email}:${this.config.apiToken}`);
        return `Basic ${credentials}`;
    }

    // Fetch tickets from Jira API
    async fetchTickets() {
        try {
            console.log('Fetching tickets from Jira...');
            
            const jql = this.config.jqlQuery || `project = ${this.config.projectKey} ORDER BY priority DESC, updated DESC`;
            // Use proxy server to avoid CORS issues
            const proxyUrl = `http://localhost:3001/jira-proxy/rest/api/3/search`;
            
            const params = new URLSearchParams({
                jql: jql,
                maxResults: this.config.maxResults || 10,
                fields: 'key,summary,status,priority,assignee,updated,created,issuetype'
            });

            const response = await fetch(`${proxyUrl}?${params}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const tickets = this.transformTickets(data.issues);
            
            this.cache = { tickets };
            this.lastFetch = new Date();
            
            console.log(`Successfully fetched ${tickets.length} tickets from Jira`);
            
            // Trigger dashboard update
            if (window.dashboard) {
                window.dashboard.updateTicketsFromJira(this.cache);
            }
            
            return this.cache;
            
        } catch (error) {
            console.error('Error fetching Jira tickets:', error);
            
            // Show user-friendly error message
            this.showError(error.message);
            
            // Fall back to static data if available
            return this.getFallbackData();
        }
    }

    // Transform Jira API response to dashboard format
    transformTickets(issues) {
        return issues.map(issue => ({
            key: issue.key,
            title: issue.fields.summary,
            status: issue.fields.status.name,
            priority: issue.fields.priority?.name || 'Medium',
            assignee: issue.fields.assignee?.displayName || 'Unassigned',
            updated: issue.fields.updated.split('T')[0], // Format: YYYY-MM-DD
            created: issue.fields.created.split('T')[0],
            type: issue.fields.issuetype.name,
            url: `${this.config.baseUrl}/browse/${issue.key}`
        }));
    }

    // Get cached data or fetch if needed
    async getTickets() {
        if (this.cache && this.isDataFresh()) {
            return this.cache;
        }
        
        return await this.fetchTickets();
    }

    // Check if cached data is still fresh
    isDataFresh() {
        if (!this.lastFetch) return false;
        const maxAge = 5 * 60 * 1000; // 5 minutes
        return (Date.now() - this.lastFetch.getTime()) < maxAge;
    }

    // Get fallback data when Jira is unavailable
    getFallbackData() {
        console.log('Using fallback ticket data');
        return {
            tickets: [
                {
                    key: "INFRA-OFFLINE",
                    title: "Jira integration temporarily unavailable",
                    status: "Info",
                    priority: "Low",
                    assignee: "System",
                    updated: new Date().toISOString().split('T')[0],
                    type: "System",
                    url: "#"
                }
            ]
        };
    }

    // Show error message to user
    showError(message) {
        const errorDiv = document.getElementById('jira-error');
        if (errorDiv) {
            errorDiv.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    Jira connection issue: ${message}
                    <br><small>Using cached or fallback data</small>
                </div>
            `;
            errorDiv.style.display = 'block';
        }
    }

    // Clear error message
    clearError() {
        const errorDiv = document.getElementById('jira-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    // Manual refresh
    async refresh() {
        this.cache = null;
        return await this.fetchTickets();
    }

    // Get connection status
    getStatus() {
        return {
            enabled: this.config.enabled,
            connected: this.cache !== null,
            lastFetch: this.lastFetch,
            nextRefresh: this.refreshTimer ? new Date(Date.now() + this.config.refreshInterval) : null
        };
    }

    // Cleanup
    destroy() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
}

// Export for use in dashboard
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JiraService;
} else {
    window.JiraService = JiraService;
}
