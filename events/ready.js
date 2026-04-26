import { ActivityType, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder } from "discord.js";

export default {
  name: "clientReady",
  once: true,
  execute(client, config) {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity("Orders | Select from menu", { type: ActivityType.Listening });

    // Send the order menu to the specified channel
    const guild = client.guilds.cache.get(config.guildId);
    if (guild) {
      const channel = guild.channels.cache.get("1474017091236532365"); // The channel ID for the dropdown
      if (channel && channel.isTextBased()) {
        const menu = new StringSelectMenuBuilder()
          .setCustomId("order_type_select")
          .setPlaceholder("Choose a commission type")
          .addOptions([
            {
              label: "Livery",
              description: "Create a custom livery commission.",
              value: "livery"
            },
            {
              label: "Logo",
              description: "Create a logo commission.",
              value: "logo"
            },
            {
              label: "Banner",
              description: "Create a banner commission.",
              value: "banner"
            }
          ]);

        const row = new ActionRowBuilder().addComponents(menu);
        const embed = new EmbedBuilder()
          .setTitle("🎨 Commission Request")
          .setDescription("Welcome to our commissions service! Select the type of commission you'd like to order below. We only accept Robux for payments.\n\n**Available Commissions:**")
          .setColor(0x00ff00)
          .addFields(
            { name: "Livery", value: "Custom livery designs for your vehicles.", inline: true },
            { name: "Logo", value: "Professional logo creation.", inline: true },
            { name: "Banner", value: "Eye-catching banner designs.", inline: true }
          )
          .setFooter({ text: "Note: You can only have one open order per type at a time." });

        channel.send({ embeds: [embed], components: [row] })
          .catch(console.error);
      }
    }
  }
};
