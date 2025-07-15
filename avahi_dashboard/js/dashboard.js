// Dashboard JavaScript
class AvahiDashboard {
    constructor() {
        this.teamData = null;
        this.shiftsData = null;
        this.ticketsData = null;
        this.jiraService = null;
        this.init();
    }

    async init() {
        // Make dashboard globally available for Jira service
        window.dashboard = this;
        
        this.updateDateTime();
        setInterval(() => this.updateDateTime(), 1000);
        
        await this.loadData();
        this.initJiraService();
        this.setupEventListeners();
        
        this.renderCurrentShift();
        this.renderTeamDirectory();
        this.renderInfrastructureDirectory();
        this.renderJiraTickets();
        this.renderWeeklySchedule();
    }

    initJiraService() {
        if (typeof JIRA_CONFIG !== 'undefined' && typeof JiraService !== 'undefined') {
            this.jiraService = new JiraService(JIRA_CONFIG);
            this.jiraService.init();
            this.updateJiraStatus();
        }
    }

    setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshTickets');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshTickets());
        }
    }

    updateDateTime() {
        const now = new Date();
        const timeOptions = { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: true 
        };
        const dateOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };

        // EST Time
        const estTime = now.toLocaleTimeString('en-US', {
            ...timeOptions,
            timeZone: 'America/New_York'
        });
        
        // UK Time
        const ukTime = now.toLocaleTimeString('en-GB', {
            ...timeOptions,
            timeZone: 'Europe/London'
        });

        document.getElementById('estTime').textContent = estTime;
        document.getElementById('ukTime').textContent = ukTime;
        document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', dateOptions);
    }

    async loadData() {
        try {
            // Load team data
            const teamResponse = await fetch('static/team.json');
            this.teamData = await teamResponse.json();

            // Load shifts data (with aggressive cache busting)
            const shiftsResponse = await fetch(`static/shifts.csv?t=${Date.now()}`, {
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            const shiftsText = await shiftsResponse.text();
            console.log('Raw CSV text:', shiftsText.substring(0, 500));
            this.shiftsData = this.parseCSV(shiftsText);
            
            // Debug: Log the first few rows to verify data
            console.log('Parsed shifts data:', this.shiftsData.slice(0, 5));
            
            // Debug: Check today's date calculation
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;
            console.log('Today calculated as:', todayStr);
            console.log('Today from Date object:', today.toDateString());

            // Load tickets data (with fallback if file doesn't exist)
            try {
                const ticketsResponse = await fetch('static/jira-tickets.json');
                this.ticketsData = await ticketsResponse.json();
            } catch (error) {
                console.log('Jira tickets file not found, using sample data');
                this.ticketsData = this.getSampleTickets();
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            data.push(row);
        }
        return data;
    }

    getSampleTickets() {
        return {
            tickets: [
                {
                    key: "SD-123",
                    title: "Database performance optimization needed",
                    status: "In Progress",
                    priority: "High",
                    assignee: "Abuzar Shaikh",
                    updated: "2025-07-15",
                    url: "https://sgkservices.atlassian.net/browse/SD-123"
                },
                {
                    key: "SD-124",
                    title: "SSL certificate renewal for production",
                    status: "To Do",
                    priority: "Medium",
                    assignee: "Dada Peer",
                    updated: "2025-07-14",
                    url: "https://sgkservices.atlassian.net/browse/SD-124"
                },
                {
                    key: "SD-125",
                    title: "Monitoring alerts configuration",
                    status: "Done",
                    priority: "Low",
                    assignee: "Devendra Talhande",
                    updated: "2025-07-13",
                    url: "https://sgkservices.atlassian.net/browse/SD-125"
                },
                {
                    key: "SD-126",
                    title: "Load balancer health check issues",
                    status: "In Progress",
                    priority: "High",
                    assignee: "Mangesh Kaslikar",
                    updated: "2025-07-15",
                    url: "https://sgkservices.atlassian.net/browse/SD-126"
                },
                {
                    key: "SD-127",
                    title: "Backup system verification",
                    status: "To Do",
                    priority: "Medium",
                    assignee: "Juan Pablo",
                    updated: "2025-07-12",
                    url: "https://sgkservices.atlassian.net/browse/SD-127"
                }
            ]
        };
    }

    getCurrentShift() {
        const now = new Date();
        const currentHour = now.getHours();
        
        // Convert shift times to 24-hour format for comparison
        // 7PM - 3AM (19:00 - 03:00)
        // 3AM - 11AM (03:00 - 11:00)  
        // 11AM - 7PM (11:00 - 19:00)
        
        if (currentHour >= 19 || currentHour < 3) {
            return 'Shift 1'; // 7PM - 3AM
        } else if (currentHour >= 3 && currentHour < 11) {
            return 'Shift 2'; // 3AM - 11AM
        } else {
            return 'Shift 3'; // 11AM - 7PM
        }
    }

    getCurrentWorkingEngineers() {
        const todayShifts = this.getTodayShifts();
        const currentShift = this.getCurrentShift();
        
        const engineers = [];
        
        // Add Avahi Support Team (24/7 shifts)
        if (todayShifts) {
            const shifts = [
                { name: 'Shift 1', data: todayShifts['Shift 1'], time: '7PM - 3AM' },
                { name: 'Shift 2', data: todayShifts['Shift 2'], time: '3AM - 11AM' },
                { name: 'Shift 3', data: todayShifts['Shift 3'], time: '11AM - 7PM' }
            ];
            
            shifts.forEach(shift => {
                if (shift.name === currentShift) {
                    const person = shift.data.split(' - ').slice(2).join(' - ');
                    engineers.push({
                        name: person,
                        shift: shift.name,
                        time: shift.time,
                        isCurrent: true,
                        team: 'Support'
                    });
                }
            });
        }
        
        // Add Infrastructure Team (business hours)
        const infraEngineers = this.getCurrentInfrastructureEngineers();
        engineers.push(...infraEngineers);
        
        return engineers;
    }

    getCurrentInfrastructureEngineers() {
        if (!this.teamData || !this.teamData.InfrastructureTeam) return [];
        
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const currentHour = now.getHours();
        
        // Check if it's a weekday (Monday-Friday)
        const isWeekday = currentDay >= 1 && currentDay <= 5;
        if (!isWeekday) return [];
        
        const infraEngineers = [];
        
        this.teamData.InfrastructureTeam.forEach(member => {
            if (!member.working_hours) return;
            
            let isWorking = false;
            let workingHours = '';
            
            if (member.working_hours.includes('EST')) {
                // EST working hours: 8am-5pm EST
                isWorking = currentHour >= 8 && currentHour < 17;
                workingHours = '8AM - 5PM EST';
            } else if (member.working_hours.includes('UK')) {
                // UK working hours: 8am-5pm UK time
                // Convert current EST time to UK time (EST + 5 hours)
                const ukHour = (currentHour + 5) % 24;
                isWorking = ukHour >= 8 && ukHour < 17;
                workingHours = '8AM - 5PM UK';
            }
            
            if (isWorking) {
                infraEngineers.push({
                    name: member.name,
                    shift: 'Business Hours',
                    time: workingHours,
                    isCurrent: true,
                    team: 'Infrastructure'
                });
            }
        });
        
        return infraEngineers;
    }

    getTodayShifts() {
        const today = new Date();
        // Use local date instead of UTC to avoid timezone issues
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        return this.shiftsData.find(shift => shift.Date === todayStr);
    }

    renderCurrentShift() {
        const container = document.getElementById('currentShiftInfo');
        const currentEngineers = this.getCurrentWorkingEngineers();

        if (currentEngineers.length === 0) {
            container.innerHTML = '<div class="no-current-shift">No engineers currently on shift</div>';
            return;
        }

        const engineersHtml = currentEngineers.map(engineer => {
            const initials = engineer.name.split(' ').map(n => n[0]).join('');
            
            return `
                <div class="current-engineer" data-team="${engineer.team}">
                    <div class="current-engineer-avatar">${initials}</div>
                    <div class="current-engineer-name">${engineer.name}</div>
                    <div class="current-engineer-shift">Currently Working</div>
                    <div class="current-engineer-time">${engineer.time}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = engineersHtml;
    }

    renderTeamDirectory() {
        const container = document.getElementById('teamDirectory');
        
        if (!this.teamData || !this.teamData.AvahiSupportTeam) {
            container.innerHTML = '<div class="loading">No team data available</div>';
            return;
        }

        const teamHtml = this.teamData.AvahiSupportTeam.map(member => {
            const initials = member.name.split(' ').map(n => n[0]).join('');
            
            return `
                <div class="team-member">
                    <div class="member-photo placeholder">${initials}</div>
                    <div class="member-info">
                        <h3>${member.name}</h3>
                        <div class="member-title">${member.title}</div>
                        <div class="member-contact">
                            <a href="mailto:${member.email}" class="contact-link">
                                <i class="fas fa-envelope"></i> Email
                            </a>
                            <a href="${member.teams}" class="contact-link teams" target="_blank">
                                <i class="fab fa-microsoft"></i> Teams
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = teamHtml;
    }

    renderInfrastructureDirectory() {
        const container = document.getElementById('infrastructureDirectory');
        
        if (!this.teamData || !this.teamData.InfrastructureTeam) {
            container.innerHTML = '<div class="loading">No infrastructure team data available</div>';
            return;
        }

        const teamHtml = this.teamData.InfrastructureTeam.map(member => {
            const initials = member.name.split(' ').map(n => n[0]).join('');
            
            return `
                <div class="team-member">
                    <div class="member-photo placeholder">${initials}</div>
                    <div class="member-info">
                        <h3>${member.name}</h3>
                        <div class="member-title">${member.title}</div>
                        ${member.working_hours ? `<div class="member-hours"><i class="fas fa-clock"></i> ${member.working_hours}</div>` : ''}
                        <div class="member-contact">
                            <a href="mailto:${member.email}" class="contact-link">
                                <i class="fas fa-envelope"></i> Email
                            </a>
                            <a href="${member.teams}" class="contact-link teams" target="_blank">
                                <i class="fab fa-microsoft"></i> Teams
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = teamHtml;
    }

    renderJiraTickets() {
        const container = document.getElementById('jiraTickets');
        
        if (!this.ticketsData || !this.ticketsData.tickets) {
            container.innerHTML = '<div class="loading">No ticket data available</div>';
            return;
        }

        const ticketsHtml = this.ticketsData.tickets.slice(0, 5).map(ticket => {
            const priorityClass = ticket.priority.toLowerCase().replace(' ', '-') + '-priority';
            const statusClass = ticket.status.toLowerCase().replace(/\s+/g, '-');
            
            return `
                <div class="ticket-item ${priorityClass}">
                    <div class="ticket-info">
                        <h4><a href="${ticket.url}" target="_blank" style="color: inherit; text-decoration: none;">${ticket.title}</a></h4>
                        <div class="ticket-key">${ticket.key}</div>
                    </div>
                    <div class="ticket-meta">
                        <span class="ticket-status status-${statusClass}">${ticket.status}</span>
                        <span>Assigned: ${ticket.assignee}</span>
                        <span>Updated: ${new Date(ticket.updated).toLocaleDateString()}</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = ticketsHtml;
    }

    // Update tickets from Jira service
    updateTicketsFromJira(ticketsData) {
        this.ticketsData = ticketsData;
        this.renderJiraTickets();
        this.updateJiraStatus();
        
        if (this.jiraService) {
            this.jiraService.clearError();
        }
    }

    // Manual refresh tickets
    async refreshTickets() {
        const refreshBtn = document.getElementById('refreshTickets');
        if (refreshBtn) {
            refreshBtn.classList.add('spinning');
        }

        try {
            if (this.jiraService) {
                await this.jiraService.refresh();
            } else {
                // Fallback to static data reload
                const ticketsResponse = await fetch('static/jira-tickets.json');
                this.ticketsData = await ticketsResponse.json();
                this.renderJiraTickets();
            }
        } catch (error) {
            console.error('Error refreshing tickets:', error);
        } finally {
            if (refreshBtn) {
                refreshBtn.classList.remove('spinning');
            }
        }
    }

    // Update Jira connection status
    updateJiraStatus() {
        const statusDiv = document.getElementById('jiraStatus');
        if (!statusDiv) return;

        if (!this.jiraService) {
            statusDiv.innerHTML = '<span class="status-indicator status-disabled"></span>Static Data';
            return;
        }

        const status = this.jiraService.getStatus();
        let statusHtml = '';
        
        if (!status.enabled) {
            statusHtml = '<span class="status-indicator status-disabled"></span>Disabled';
        } else if (status.connected) {
            const lastFetch = status.lastFetch ? status.lastFetch.toLocaleTimeString() : 'Never';
            statusHtml = `<span class="status-indicator status-connected"></span>Live (${lastFetch})`;
        } else {
            statusHtml = '<span class="status-indicator status-disconnected"></span>Disconnected';
        }
        
        statusDiv.innerHTML = statusHtml;
    }

    renderWeeklySchedule() {
        const container = document.getElementById('weeklySchedule');
        
        if (!this.shiftsData) {
            container.innerHTML = '<div class="loading">No schedule data available</div>';
            return;
        }

        // Use local date instead of UTC to avoid timezone issues
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        const tableHtml = `
            <table class="schedule-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Day</th>
                        <th>Night Shift<br><small>7PM - 3AM</small></th>
                        <th>Morning Shift<br><small>3AM - 11AM</small></th>
                        <th>Day Shift<br><small>11AM - 7PM</small></th>
                    </tr>
                </thead>
                <tbody>
                    ${this.shiftsData.map(shift => {
                        const isToday = shift.Date === todayStr;
                        // Parse date properly to avoid timezone issues
                        const dateParts = shift.Date.split('-');
                        const date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                        const formattedDate = date.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                        });
                        
                        return `
                            <tr class="${isToday ? 'today' : ''}">
                                <td class="schedule-date">${formattedDate}</td>
                                <td class="schedule-day">${shift.Day}</td>
                                <td class="shift-cell">${this.formatShiftCell(shift['Shift 1'])}</td>
                                <td class="shift-cell">${this.formatShiftCell(shift['Shift 2'])}</td>
                                <td class="shift-cell">${this.formatShiftCell(shift['Shift 3'])}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHtml;
    }

    formatShiftCell(shiftData) {
        const parts = shiftData.split(' - ');
        const person = parts.slice(2).join(' - ');
        return `<div class="shift-person">${person}</div>`;
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AvahiDashboard();
});
