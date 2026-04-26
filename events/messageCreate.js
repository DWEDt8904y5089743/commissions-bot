export default {
  name: "messageCreate",
  async execute(message, config) {
    if (message.author.bot || !message.guild) return;

    const prefix = config.prefix || "!";
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();
    if (!commandName) return;

    const command = message.client.commands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args, config);
    } catch (error) {
      console.error(`Error executing command ${commandName}:`, error);
      await message.reply("There was an error running that command.");
    }
  }
};
