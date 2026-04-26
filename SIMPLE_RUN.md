# Simple Run Guide

## Prerequisites
- Node.js 18+ installed
- Discord bot token and server IDs configured in config.json

## Quick Start
1. Install dependencies: `npm install`
2. Deploy commands: `npm run deploy` (one-time)
3. Start the bot: `npm start` or `node index.js`

## For Background Running
- Use `npm install -g pm2` then `pm2 start index.js`
- Or use `nohup node index.js &` for simple background

## Testing
- The bot will log 'Logged in as [Bot Name]' when ready
- Health check available at http://localhost:3000/health

## Stopping
- Ctrl+C to stop
- Or `pm2 stop index` if using PM2
