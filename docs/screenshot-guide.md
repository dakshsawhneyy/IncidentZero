# Screenshot Capture Guide for README

To complete the README, capture the following screenshots from [www.incidentzero.monster](https://www.incidentzero.monster):

## Required Screenshots

### 1. Landing Page
**Filename:** `application/frontend/public/screenshots/01-landing.png`
- Capture: Full homepage view
- Shows: Hero section, value proposition, call-to-action
- Resolution: 1920x1080

### 2. Incidents List
**Filename:** `application/frontend/public/screenshots/02-incidents-list.png`
- Capture: Available incidents dashboard
- Shows: All 5 incident scenarios with severity levels
- Resolution: 1920x1080

### 3. Incident Brief
**Filename:** `application/frontend/public/screenshots/03-incident-brief.png`
- Capture: Detailed incident description page
- Shows: Incident symptoms, severity, impact
- Resolution: 1920x1080

### 4. Investigation Interface
**Filename:** `application/frontend/public/screenshots/04-investigation.png`
- Capture: Investigation tools and workflow
- Shows: Grafana/Prometheus integration, log viewer, terminal access
- Resolution: 1920x1080

### 5. Report Submission
**Filename:** `application/frontend/public/screenshots/05-report-submission.png`
- Capture: RCA report form
- Shows: Root cause analysis input fields
- Resolution: 1920x1080

### 6. AI Feedback Report
**Filename:** `application/frontend/public/screenshots/06-feedback-report.png`
- Capture: Investigation score and feedback
- Shows: Score breakdown, recommendations, areas for improvement
- Resolution: 1920x1080

## How to Capture Screenshots

### Method 1: Browser DevTools (Recommended)
1. Open Chrome/Edge DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Set resolution to 1920x1080
4. Navigate to each page
5. Right-click → "Capture screenshot"

### Method 2: Browser Extensions
- Use "Full Page Screen Capture" or similar
- Set viewport to 1920x1080
- Navigate and capture each page

### Method 3: Manual Capture
- Set browser window to full screen
- Use Windows Snipping Tool (Win+Shift+S)
- Capture each page carefully

## Adding Screenshots to README

Once captured, add them to the README in the appropriate sections:

```markdown
## Platform Preview

### Landing Page
![Landing Page](application/frontend/public/screenshots/01-landing.png)

### Incident Dashboard
![Incidents List](application/frontend/public/screenshots/02-incidents-list.png)

### Investigation Workflow
![Investigation Interface](application/frontend/public/screenshots/04-investigation.png)

### AI-Powered Feedback
![Feedback Report](application/frontend/public/screenshots/06-feedback-report.png)
```

Insert this "Platform Preview" section after the "What Makes IncidentZero Different" section in the README.

## Screenshot Optimization

After capturing:
1. Optimize file size using tools like TinyPNG
2. Ensure text is readable
3. Keep file sizes under 500KB each
4. Maintain aspect ratio
5. Use PNG format for UI screenshots

## Alternative: Video Walkthrough

Consider creating a short demo video (2-3 minutes) showing:
1. Landing on the platform
2. Selecting an incident
3. Quick investigation workflow
4. Viewing feedback report

Upload to YouTube and embed in README:
```markdown
## Platform Demo
[![IncidentZero Demo](http://img.youtube.com/vi/VIDEO_ID/0.jpg)](https://www.youtube.com/watch?v=VIDEO_ID)
```
