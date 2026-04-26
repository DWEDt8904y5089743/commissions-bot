import { EmbedBuilder } from "discord.js";
import fs from "fs";
import path from "path";

const reviewsFile = path.join(process.cwd(), "reviews.json");

function loadReviews() {
  if (!fs.existsSync(reviewsFile)) return {};
  return JSON.parse(fs.readFileSync(reviewsFile, "utf8"));
}

function saveReviews(reviews) {
  fs.writeFileSync(reviewsFile, JSON.stringify(reviews, null, 2));
}

export default {
  name: "messageReactionAdd",
  async execute(reaction, user, config) {
    if (user.bot) return;
    if (!reaction.message.guild) return;
    if (reaction.message.channel.id !== config.reviewChannelId) return;
    if (!["✅", "❌"].includes(reaction.emoji.name)) return;

    const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
    if (!member || !member.roles.cache.has(config.staffRoleId)) return;

    const reviews = loadReviews();
    const reviewEntry = Object.values(reviews).find(r => r.messageId === reaction.message.id);
    if (!reviewEntry) return;

    const message = reaction.message;
    if (!message.embeds.length) return;
    const embed = message.embeds[0];
    const approved = reaction.emoji.name === "✅";
    const statusText = approved ? "Approved by Staff" : "Rejected by Staff";
    const colour = approved ? 0x00ff00 : 0xff0000;

    const updatedEmbed = EmbedBuilder.from(embed)
      .setColor(colour)
      .setFooter({ text: statusText });

    await message.edit({ embeds: [updatedEmbed] });

    reviewEntry.reviewedBy = statusText;
    reviewEntry.autoApprove = approved;
    saveReviews(reviews);

    if (!approved) {
      const author = await reaction.message.guild.members.fetch(reviewEntry.userId).catch(() => null);
      if (author) {
        author.send(`Your review for ${reviewEntry.type} was rejected by staff and will not be published.`).catch(() => null);
      }
    }
  }
};