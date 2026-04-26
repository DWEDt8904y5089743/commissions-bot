# Simple Hosting on Replit (Free)

## Why Replit?
- Free tier available
- Easy setup (no server management)
- Uptime Robot can ping to keep it awake
- Node.js support built-in

## Quick Setup Steps

1. **Create Replit Account**
   - Go to https://replit.com
   - Sign up (GitHub login works)

2. **Create New Repl**
   - Click 'Create' → 'Import from GitHub'
   - Paste your repo URL: https://github.com/yourusername/commissions-bot
   - Or upload files manually

3. **Install Dependencies**
   - Replit auto-detects package.json
   - It will run `npm install` automatically

4. **Configure Secrets**
   - In Replit, go to 'Secrets' (lock icon)
   - Add these secrets (use .env.example as reference):
     - \`DISCORD_TOKEN\` = your bot token
     - \`CLIENT_ID\` = your bot client ID
     - \`GUILD_ID\` = your server ID
     - \`ORDER_CATEGORY_ID\` = category for order channels
     - \`TICKET_LOG_CHANNEL_ID\` = log channel ID
     - \`REVIEW_CHANNEL_ID\` = review channel ID
     - \`STAFF_ROLE_ID\` = staff role ID
   - The bot will automatically use these instead of config.json

5. **Run the Bot**
   - Click 'Run' button
   - Bot starts and shows 'Logged in as...'
   - Get the repl URL (e.g., https://your-repl.replit.dev)

6. **Set Up Uptime Robot**
   - Go to https://uptimerobot.com
   - Add monitor: `https://your-repl.replit.dev/health`
   - Set interval: 5 minutes
   - Enable alerts

## Keep It Running
- Replit free tier sleeps after inactivity
- Uptime Robot pings every 5 mins to keep it awake
- Bot stays online 24/7 this way

## Alternative: Glitch
- Similar to Replit
- https://glitch.com
- Import from GitHub, same steps

## Costs
- Free forever (with Uptime Robot monitoring)
- Upgrade to paid if you need more resources
