import { EmbedBuilder } from "discord.js";
import fs from "fs";
import path from "path";

const reviewsFile = path.join(process.cwd(), "reviews.json");
const reviewSettingsFile = path.join(process.cwd(), "review-settings.json");

function loadReviews() {
  if (!fs.existsSync(reviewsFile)) return {};
  return JSON.parse(fs.readFileSync(reviewsFile, "utf8"));
}

function saveReviews(reviews) {
  fs.writeFileSync(reviewsFile, JSON.stringify(reviews, null, 2));
}

function loadReviewSettings() {
  if (!fs.existsSync(reviewSettingsFile)) {
    const defaultSettings = { autoApprove: true };
    fs.writeFileSync(reviewSettingsFile, JSON.stringify(defaultSettings, null, 2));
    return defaultSettings;
  }
  return JSON.parse(fs.readFileSync(reviewSettingsFile, "utf8"));
}

function saveReviewSettings(settings) {
  fs.writeFileSync(reviewSettingsFile, JSON.stringify(settings, null, 2));
}

function resolveDesignerMention(input) {
  if (!input) return "Unknown Designer";
  const mentionMatch = input.match(/^<@!?(\d+)>$/);
  if (mentionMatch) return `<@${mentionMatch[1]}>`;
  const idMatch = input.match(/^(\d{17,19})$/);
  if (idMatch) return `<@${idMatch[1]}>`;
  return input;
}

const swearWords = ["fuck", "shit", "damn", "bitch", "asshole", "crap"];

function containsSwearWords(text) {
  const lower = text.toLowerCase();
  return swearWords.some(word => lower.includes(word));
}

export default {
  data: { name: "review", description: "Leave a review for a completed commission." },

  async execute(message, args, config) {
    const type = args[0]?.toLowerCase();
    const stars = parseInt(args[1], 10);
    const designerArg = args[2];
    const reviewText = args.slice(3).join(" ");

    if (!type || !["livery", "logo", "banner"].includes(type)) {
      return message.reply(
        "Usage: !review <livery|logo|banner> <stars 1-5> <designer mention|id> <review text>"
      );
    }

    if (isNaN(stars) || stars < 1 || stars > 5) {
      return message.reply("Please provide a valid star rating between 1 and 5.");
    }

    if (!designerArg) {
      return message.reply("Please mention or provide the ID of the designer.");
    }

    if (!reviewText) {
      return message.reply("Please include a review message after the designer mention.");
    }

    const guild = message.guild;
    const user = message.author;
    const designerMention = message.mentions.users.first()
      ? `<@${message.mentions.users.first().id}>`
      : resolveDesignerMention(designerArg);

    const hasSwear = containsSwearWords(reviewText);
    const reviewSettings = loadReviewSettings();
    const autoApprove = reviewSettings.autoApprove && !hasSwear;
    const reviewedBy = autoApprove ? "Bot (Auto-approved)" : "Pending Staff Review";

    const embed = new EmbedBuilder()
      .setTitle(`Review for ${type.charAt(0).toUpperCase() + type.slice(1)} Commission`)
      .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
      .addFields(
        { name: "Rating", value: "⭐".repeat(stars), inline: true },
        { name: "Designer", value: designerMention, inline: true },
        { name: "Review", value: reviewText, inline: false }
      )
      .setColor(autoApprove ? 0x00ff00 : 0xffa500)
      .setTimestamp()
      .setFooter({ text: `Reviewed by: ${reviewedBy}` });

    let reviewChannel = guild.channels.cache.get(config.reviewChannelId);
    if (!reviewChannel) {
      reviewChannel = await guild.channels.fetch(config.reviewChannelId).catch(() => null);
    }

    if (!reviewChannel?.isTextBased() && config.ticketLogChannelId) {
      console.warn(
        `Review channel unavailable: ${config.reviewChannelId}. Trying ticket log channel ${config.ticketLogChannelId} instead.`
      );
      reviewChannel = guild.channels.cache.get(config.ticketLogChannelId);
      if (!reviewChannel) {
        reviewChannel = await guild.channels.fetch(config.ticketLogChannelId).catch(() => null);
      }
    }

    let pendingMessage = null;
    if (reviewChannel?.isTextBased()) {
      if (autoApprove) {
        await reviewChannel.send({ embeds: [embed] });
      } else {
        pendingMessage = await reviewChannel.send({ embeds: [embed] });
        await pendingMessage.react("✅");
        await pendingMessage.react("❌");
      }
    } else {
      console.error(
        `Unable to send review log. reviewChannelId=${config.reviewChannelId}, ticketLogChannelId=${config.ticketLogChannelId}`
      );
      return message.reply(
        "Review submitted, but I could not post it to the review log channel. Please check the bot config."
      );
    }

    const reviews = loadReviews();
    const reviewId = Date.now().toString();
    reviews[reviewId] = {
      userId: user.id,
      type,
      stars,
      designer: designerMention,
      review: reviewText,
      hasSwear,
      reviewedBy,
      autoApprove,
      timestamp: new Date().toISOString(),
      messageId: pendingMessage?.id || null
    };
    saveReviews(reviews);

    await message.reply("Thank you for your review! It has been submitted.");
  }
};