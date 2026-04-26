# Free Hosting on Render (100% Free)

## Why Render?
- 100% free tier (no credit card required)
- No sleep/idle issues
- Automatic deployments from GitHub
- Uptime Robot monitoring built-in
- Node.js support

## Quick Setup Steps

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub (free, no card needed)

2. **Connect GitHub**
   - Authorize Render to access your repo
   - Or create from scratch and upload files

3. **Create Web Service**
   - Click 'New' → 'Web Service'
   - Connect your GitHub repo: https://github.com/yourusername/commissions-bot
   - Or paste code if not on GitHub

4. **Configure Service**
   - **Name**: commissions-bot
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Add these environment variables:
     - `DISCORD_TOKEN` = your bot token
     - `CLIENT_ID` = your bot client ID
     - `GUILD_ID` = your server ID
     - `ORDER_CATEGORY_ID` = category for orders
     - `TICKET_LOG_CHANNEL_ID` = log channel ID
     - `REVIEW_CHANNEL_ID` = review channel ID
     - `STAFF_ROLE_ID` = staff role ID
     - `NODE_ENV` = production

5. **Deploy**
   - Click 'Create Web Service'
   - Render builds and deploys automatically
   - Get your service URL (e.g., https://commissions-bot.onrender.com)

6. **Set Up Uptime Robot**
   - Go to https://uptimerobot.com
   - Add monitor: `https://commissions-bot.onrender.com/health`
   - Set interval: 5 minutes
   - Enable email alerts

## Keep It Running
- Render free tier runs 24/7
- No sleep or idle limits
- Uptime Robot provides extra monitoring and alerts

## Alternative: Railway
- Similar free tier: https://railway.app
- Also 100% free, no card required
- Same steps: connect GitHub, add env vars, deploy

## Costs
- 100% free forever
- 750 hours/month free on Render
- Upgrade only if you exceed limits

## Notes
- Bot stays online continuously
- Automatic restarts on crashes
- Easy to update: push to GitHub, Render redeploys
