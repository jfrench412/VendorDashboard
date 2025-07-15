# Avahi Support Dashboard - Setup and Maintenance Guide

## Overview
This dashboard provides a comprehensive view of the Avahi Support Team including current shift status, team directory, recent Jira tickets, and weekly schedules. The design matches the Propelis corporate theme.

## File Structure
```
avahi_dashboard/
├── index.html                 # Main dashboard page
├── css/
│   └── styles.css            # Propelis-themed styling
├── js/
│   └── dashboard.js          # Dashboard functionality
├── assets/
│   └── profile-pics/         # Team member photos (create this directory)
└── static/
    ├── team.json             # Team member information
    ├── shifts.csv            # Shift schedule data
    └── jira-tickets.json     # Jira ticket information
```

## Setup Instructions

### 1. Profile Pictures
Create the `assets/profile-pics/` directory and add team member photos:
- `abuzar.jpg` - Abuzar Shaikh's photo
- `dada.jpg` - Dada Peer's photo
- `devendra.jpg` - Devendra Talhande's photo
- `mangesh.jpg` - Mangesh Kaslikar's photo
- `juan.jpg` - Juan Pablo's photo

**Image Requirements:**
- Format: JPG, PNG, or WebP
- Size: 200x200 pixels recommended
- Square aspect ratio for best results

### 2. Updating Team Information
Edit `static/team.json` to add/modify team members:
```json
{
  "AvahiSupportTeam": [
    {
      "name": "Full Name",
      "title": "Job Title",
      "email": "email@sgkinc.com",
      "teams": "https://teams.microsoft.com/l/chat/0/0?users=email@sgkinc.com",
      "profile_pic": "/assets/profile-pics/filename.jpg"
    }
  ]
}
```

### 3. Updating Shift Schedule
Edit `static/shifts.csv` with new schedule data:
```csv
Date,Day,Shift 1,Shift 2,Shift 3
2025-07-15,Tuesday,7PM - 3AM - Person1,3AM - 11AM - Person2,11AM - 7PM - Person3
```

### 4. Updating Jira Tickets
Edit `static/jira-tickets.json` to add/update tickets:
```json
{
  "tickets": [
    {
      "key": "INFRA-XXX",
      "title": "Ticket description",
      "status": "In Progress",
      "priority": "High",
      "assignee": "Team Member Name",
      "updated": "2025-07-15",
      "url": "https://yourcompany.atlassian.net/browse/INFRA-XXX"
    }
  ]
}
```

**Supported Status Values:**
- "To Do" (displays as gray)
- "In Progress" (displays as blue)
- "Done" (displays as green)

**Supported Priority Values:**
- "High" (red border)
- "Medium" (yellow border)
- "Low" (green border)

## Deployment to AWS S3

### Prerequisites
- AWS S3 bucket configured for static website hosting
- Bucket policy allowing public read access

### Deployment Steps
1. Upload all files in the `avahi_dashboard/` directory to your S3 bucket
2. Ensure the bucket has static website hosting enabled
3. Set `index.html` as the index document
4. Access the dashboard via your S3 bucket's public URL

### S3 Bucket Policy Example
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

## Features

### Current Shift Status
- Automatically detects and highlights the current shift based on time
- Shows all three shifts for today with current shift emphasized

### Team Directory
- Displays team member cards with photos (or initials if no photo)
- Direct email and Microsoft Teams links
- Responsive grid layout

### Recent Jira Tickets
- Shows top 5 most recent tickets
- Color-coded by priority (High=Red, Medium=Yellow, Low=Green)
- Status indicators with appropriate colors

### Weekly Schedule
- Full week view of all shifts
- Today's row is highlighted in green
- Responsive table design

## Maintenance

### Regular Updates
1. **Weekly**: Update `shifts.csv` with new schedule
2. **As needed**: Update `jira-tickets.json` with current tickets
3. **Quarterly**: Review and update team information in `team.json`

### Adding New Team Members
1. Add their information to `static/team.json`
2. Add their profile picture to `assets/profile-pics/`
3. Update shift schedules to include them

### Customization
- Modify `css/styles.css` to adjust colors, fonts, or layout
- Update `js/dashboard.js` to add new functionality
- All styling follows Propelis corporate theme guidelines

## Troubleshooting

### Common Issues
1. **Images not loading**: Check file paths and ensure images are in `assets/profile-pics/`
2. **Data not displaying**: Verify JSON/CSV file formats and syntax
3. **Styling issues**: Clear browser cache and check CSS file loading

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- No special plugins required

## Future Enhancements
- Automated Jira integration via API
- Real-time shift notifications
- Team availability status
- Performance metrics dashboard
