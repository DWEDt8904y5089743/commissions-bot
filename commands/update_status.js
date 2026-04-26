import fs from "fs";
import path from "path";

const ordersFile = path.join(process.cwd(), "orders.json");

function loadOrders() {
  if (!fs.existsSync(ordersFile)) return {};
  return JSON.parse(fs.readFileSync(ordersFile, "utf8"));
}

function saveOrders(orders) {
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
}

export default {
  data: { name: "update_status", description: "Update the status of an order ticket (staff only)." },

  async execute(message, args, config) {
    const staffRoleId = config.staffRoleId;
    if (staffRoleId && !message.member.roles.cache.has(staffRoleId)) {
      return message.reply("You do not have permission to use this command.");
    }

    const channelId = args[0];
    const status = args[1]?.toLowerCase();

    if (!channelId || !status || !["open", "in_progress", "closed"].includes(status)) {
      return message.reply("Usage: !update_status <channel_id> <open|in_progress|closed>");
    }

    const orders = loadOrders();
    if (!orders[channelId]) {
      return message.reply("No order found for that channel ID.");
    }

    orders[channelId].status = status;
    saveOrders(orders);

    const guild = message.guild;
    const channel = guild.channels.cache.get(channelId);
    if (channel) {
      if (status === "closed") {
        await channel.send({ content: "This order has been closed. The channel will be deleted in 5 seconds." });
        setTimeout(() => channel.delete(), 5000);
      } else {
        await channel.send({ content: `Order status updated to: **${status.replace("_", " ")}**.` });
      }
    }

    message.reply(`Order status updated to: **${status.replace("_", " ")}**.`);
  }
};