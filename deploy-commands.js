import fs from "fs";
import path from "path";
import { REST, Routes } from "discord.js";
import config from "./config.json" assert { type: "json" };

const commands = [];
const commandsPath = path.join(process.cwd(), "commands");
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith(".js"))) {
  const command = await import(`./commands/${file}`);
  commands.push(command.default.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(config.token);

try {
  console.log("Registering application commands...");
  await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });
  console.log("Commands registered successfully.");
} catch (error) {
  console.error(error);
}
