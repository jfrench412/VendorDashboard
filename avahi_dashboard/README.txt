
Avahi Support Dashboard - Static Webpage

How to Deploy:
1. Upload all contents of this folder to an S3 bucket configured for static website hosting.
2. Enable static website hosting and set index document to index.html.
3. Access your dashboard via the S3 public URL.

Manual Updates:
- Update 'static/shifts.csv' to refresh the schedule.
- Update 'static/team.json' to add or change team member info.
- Replace images in 'assets/profile-pics/' with team member photos.

Notes:
- React frontend uses default index.html pointing to compiled app.js (not included in this ZIP).
- Customize styles in css/styles.css or replace frontend as needed.
