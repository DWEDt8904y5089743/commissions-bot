export default {
  data: { name: "help", description: "Show staff-only command help for commission management." },

  async execute(message, args, config) {
    const staffRoleId = config.staffRoleId;
    if (staffRoleId && !message.member.roles.cache.has(staffRoleId)) {
      return message.reply("This command is for staff only.");
    }

    const helpMessage = `**Commission Staff Help**\n\n` +
      `• !review <type> <stars> <designer mention|id> <review text> - Submit a review for a completed commission.\n` +
      `• !review_mode <on|off> - Turn auto-approval of reviews ON or OFF.\n` +
      `• !update_status <channel_id> <open|in_progress|closed> - Update an order ticket status.\n` +
      `\n` +
      `Make sure the staff role in config is set correctly, and only trusted team members use these commands.`;

    await message.reply(helpMessage);
  }
};
