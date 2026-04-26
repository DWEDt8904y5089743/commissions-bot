# Self-Hosting Guide for Commissions Bot

## Prerequisites
- A VPS or cloud server (e.g., DigitalOcean, Linode, AWS EC2)
- Node.js 18+ installed
- Git for cloning the repo

## Setup Steps

1. **Provision a VPS**
   - Choose a provider like DigitalOcean Droplet (/month)
   - Select Ubuntu 22.04 LTS
   - Enable SSH access

2. **Connect and Update**
   ```bash
   ssh root@your-server-ip
   apt update && apt upgrade -y
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   apt-get install -y nodejs
   node --version  # Verify
   ```

4. **Clone and Setup Bot**
   ```bash
   git clone https://github.com/yourusername/commissions-bot.git
   cd commissions-bot
   npm install
   ```

5. **Configure Environment**
   - Edit config.json with your bot token and IDs
   - Or use .env file if preferred

6. **Run with PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   pm2 start index.js --name commissions-bot
   pm2 startup
   pm2 save
   ```

7. **Firewall and Security**
   \`\`\`bash
   ufw allow 22/tcp  # SSH
   ufw allow 3000/tcp  # Health check
   ufw --force enable
   \`\`\`
   - Allow only necessary ports

## Monitoring with Uptime Robot
- Sign up at https://uptimerobot.com
- Add a monitor for your server's health endpoint: `http://your-server-ip:3000/health`
- Set monitor type to "HTTP(s)"
- Set monitoring interval to 5 minutes
- Set up email/SMS alerts for downtime

## Keeping Bot Alive
- PM2 handles restarts
- For free hosting alternatives (not recommended for 24/7):
  - Replit: Use their always-on feature
  - Glitch: But has sleep limits
  - Use Uptime Robot to ping your app every 5 minutes to prevent sleep

## Costs
- VPS: -10/month
- Uptime Robot: Free tier available

## Troubleshooting
- Check logs: `pm2 logs commissions-bot`
- Ensure bot token is valid
- Verify server has internet access
