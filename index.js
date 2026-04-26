import fs from "fs";
import path from "path";
import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import express from "express";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Load config, with env var fallbacks
let config;
try {
  config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
} catch (error) {
  config = {};
}

// Override with environment variables if available
config.token = process.env.DISCORD_TOKEN || config.token;
config.clientId = process.env.CLIENT_ID || config.clientId;
config.guildId = process.env.GUILD_ID || config.guildId;
config.orderCategoryId = process.env.ORDER_CATEGORY_ID || config.orderCategoryId;
config.ticketLogChannelId = process.env.TICKET_LOG_CHANNEL_ID || config.ticketLogChannelId;
config.reviewChannelId = process.env.REVIEW_CHANNEL_ID || config.reviewChannelId;
config.orderChannelPrefix = process.env.ORDER_CHANNEL_PREFIX || config.orderChannelPrefix || "order-";
config.staffRoleId = process.env.STAFF_ROLE_ID || config.staffRoleId;
config.supportRoleId = process.env.SUPPORT_ROLE_ID || config.supportRoleId;
config.prefix = process.env.PREFIX || config.prefix || "!";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.User]
});

client.commands = new Collection();
const commandsPath = path.join(process.cwd(), "commands");
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"))) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.default.data.name, command.default);
}

const eventsPath = path.join(process.cwd(), "events");
for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith(".js"))) {
  const event = await import(`./events/${file}`);
  if (event.default.once) {
    client.once(event.default.name, (...args) => event.default.execute(...args, config));
  } else {
    client.on(event.default.name, (...args) => event.default.execute(...args, config));
  }
}

// Health check server for Uptime Robot monitoring - start this first
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.status(200).send('Commissions Bot is running!');
});

app.get('/health', (req, res) => {
  const isReady = client.readyAt !== null;
  const uptime = process.uptime();

  res.status(200).json({
    status: 'OK',
    uptime,
    timestamp: new Date().toISOString(),
    discordReady: isReady,
    guilds: isReady ? client.guilds.cache.size : 0
  });
});

app.listen(PORT, () => {
  console.log(`Health check server running on port ${PORT}`);
});

client.login(config.token);
