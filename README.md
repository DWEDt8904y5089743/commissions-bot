# Commissions Bot

A Discord bot for a commissions server with order creation via dropdown, modal for details, DM handling, ticket channels with embeds, staff status updates, and audit transcripts.

## Quick Start (100% Free Hosting)

For completely free hosting with Uptime Robot monitoring:

1. **Host on Render** (see `FREE_HOSTING.md`)
2. **Connect your GitHub repo**
3. **Add environment variables** (no config.json needed)
4. **Deploy automatically**
5. **Set up Uptime Robot** for monitoring

No credit card, no sleep, 24/7 uptime! 🎉

## Features

- Persistent fancy embed in channel `1474017091236532365` with commission options and select menu
- Users can have multiple orders, but only one open per type at a time
- Modal popup to collect order details
- Professional payment warning in ticket embeds
- Attempts to DM the user; if blocked, prompts to enable DMs
- Creates private ticket channels under the configured category with fancy embeds
- Logs ticket creation in the configured log channel
- Staff command `/update_status <channel_id> <status>` to change order status (open, in_progress, closed)
- Prevents opening multiple orders of the same type simultaneously
- Close Order button (user only): Opens review modal, submits review, then closes ticket
- 🛡️ Force Close button (staff only): Immediately closes ticket without review
- `/review` - User command to leave a star rating, designer mention, and review text for completed commissions
- Reviews are sent to channel `1474017092352217280` with auto-approval if no swear words detected

## Commands

- `/update_status` - Staff only: Update status of an order ticket

## Order Tracking

Orders are stored in `orders.json` with status tracking, user details, and order descriptions. Closed orders prevent new tickets for the same type by the same user.
