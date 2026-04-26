import fs from "fs";
import path from "path";

const reviewSettingsFile = path.join(process.cwd(), "review-settings.json");

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

export default {
  data: { name: "review_mode", description: "Toggle review auto-approve on or off." },

  async execute(message, args, config) {
    const staffRoleId = config.staffRoleId;
    if (staffRoleId && !message.member.roles.cache.has(staffRoleId)) {
      return message.reply("You do not have permission to use this command.");
    }

    const mode = args[0]?.toLowerCase();
    if (!mode || !["on", "off"].includes(mode)) {
      return message.reply("Usage: !review_mode <on|off>");
    }

    const settings = loadReviewSettings();
    settings.autoApprove = mode === "on";
    saveReviewSettings(settings);

    await message.reply(`Review auto-approval is now **${settings.autoApprove ? "ON" : "OFF"}**.`);
  }
};