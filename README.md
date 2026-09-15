# Notification Flow Builder

A simple, dependency-free (uses only CDNs for Tailwind/Font Awesome) web app to demonstrate transactional notification flows, message filtering, and delivery channel selection. Built for GitHub Pages - no build steps required.

## Project Structure
```
.
├── index.html    # Main entry point (automatically loaded by GitHub Pages)
├── styles.css    # Custom CSS styles
├── app.js        # Application logic
└── README.md     # This file
```

## Features
1. Collect recipient contact information (email / phone number)
2. Start a transaction context
3. Select triggering event (payment success, order shipped, security alert, etc.)
4. Auto-filtered, non-editable pre-approved message templates matched to the selected event
5. Choose delivery channels (Email, SMS, Push Notification) with contact validation
6. Live backend view showing activity log, request payload, and architecture guidance
7. Built-in explanation of when to use message queues vs synchronous API contracts for notification systems

## Deploy to GitHub Pages
1. Push all files in this folder to a GitHub repository
2. Go to Repository Settings → Pages
3. Select `main` branch as the source, root folder
4. Your site will be live at `https://[your-username].github.io/[repo-name]/`

You can also just open `index.html` directly in any browser locally to test, no server required.
