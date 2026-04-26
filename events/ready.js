import { ActivityType, ActionRowBuilder, EmbedBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import fs from "fs";
import path from "path";

const messageStoreFile = path.join(process.cwd(), "message-store.json");
const ordersFile = path.join(process.cwd(), "orders.json");

function loadMessageStore() {
  if (!fs.existsSync(messageStoreFile)) return {};
  return JSON.parse(fs.readFileSync(messageStoreFile, "utf8"));
}

function saveMessageStore(store) {
  fs.writeFileSync(messageStoreFile, JSON.stringify(store, null, 2));
}

function loadOrders() {
  if (!fs.existsSync(ordersFile)) return {};
  return JSON.parse(fs.readFileSync(ordersFile, "utf8"));
}

export default {
  name: "clientReady",
  once: true,
  async execute(client, config) {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity("Orders | Select from menu", { type: ActivityType.Listening });

    const guild = client.guilds.cache.get(config.guildId);
    if (!guild) return;

    const store = loadMessageStore();
    const orders = loadOrders();

    // Clean up ticket channels and resend messages for active orders
    const cleanupPromises = [];

    for (const [channelId, messageIds] of Object.entries(store)) {
      const ticketChannel = guild.channels.cache.get(channelId);
      if (ticketChannel && ticketChannel.isTextBased()) {
        // Delete old bot messages
        messageIds.forEach(async (messageId) => {
          try {
            const message = await ticketChannel.messages.fetch(messageId);
            if (message && message.author.id === client.user.id) {
              await message.delete();
            }
          } catch (error) {
            // Message might already be deleted
          }
        });

        // Resend messages for active orders (skip order channel)
        if (channelId !== "1474017091236532365") {
          const order = orders[channelId];
          if (order && order.status === "open") {
            cleanupPromises.push((async () => {
              const user = await client.users.fetch(order.userId);
              const embed = new EmbedBuilder()
                .setTitle(`${order.type.charAt(0).toUpperCase() + order.type.slice(1)} Order`)
                .setDescription("Thanks for ordering! Please answer the questions in the ticket channel so staff can begin.")
                .setColor(0x00ff00)
                .addFields(
                  { name: "Ticket Owner", value: `${user}`, inline: true },
                  { name: "Order Type", value: order.type.charAt(0).toUpperCase() + order.type.slice(1), inline: true },
                  { name: "Status", value: "Open", inline: true },
                  { name: "Order Details", value: order.description || "No details provided", inline: false },
                  { name: "Payment Information", value: "⚠️ **Important:** We only accept Robux for payments. Please ensure you have sufficient funds before proceeding with your order.", inline: false }
                )
                .setTimestamp();

              const closeButton = new ButtonBuilder()
                .setCustomId("close_order")
                .setLabel("Close Order")
                .setStyle(ButtonStyle.Primary);

              const forceCloseButton = new ButtonBuilder()
                .setCustomId("force_close")
                .setLabel("🛡️ Force Close")
                .setStyle(ButtonStyle.Danger);

              const row = new ActionRowBuilder().addComponents(closeButton, forceCloseButton);

              // Send new messages and update store
              const sentEmbed = await ticketChannel.send({ embeds: [embed] });
              const buttonMessage = await ticketChannel.send({ content: "Use the button below when your order is complete or if you need to close the ticket.", components: [row] });

              store[channelId] = [sentEmbed.id, buttonMessage.id];
              saveMessageStore(store);
            })());
          }
        }
      }
    }

    // Wait for all cleanup to complete
    await Promise.all(cleanupPromises);

    // Send the order menu to the specified channel
    const channel = guild.channels.cache.get("1474017091236532365"); // The channel ID for the dropdown
    if (channel && channel.isTextBased()) {
      const channelId = channel.id;

      // Send welcome message
      const welcomeEmbed = new EmbedBuilder()
        .setTitle("🎨 Ordering System")
        .setDescription("> Welcome to **Dub's Commissions** ordering hub!\n> Here you can order **high-quality banners, liveries, and simple logos** from <@846135433888661555>.")
        .addFields(
          {
            name: "🛒 Pricing:",
            value: "> 75 <:Robux:1458316370595942464> per banner\n> 120 <:Robux:1458316370595942464> per livery\n> 100 <:Robux:1458316370595942464> per simple logo\n-# **Keep In Mind:** You will also have to cover the tax percentage.",
            inline: false
          },
          {
            name: "📋 Ordering Guidelines:",
            value: "> ``1)`` You must have payment ready at the time of making a ticket.\n> ``2)`` When you order don't ghost the order.\n> ``3)`` Have patience's, your order is not the only one.\n> ``4)`` If you change your idea/server name when I start the order, your service will be denied.\n-# Keep in mind all orders are with robux, USD option coming in the near future.",
            inline: false
          }
        )
        .setColor(0x5865f2)
        .setThumbnail(client.user.displayAvatarURL());

      // Send order menu
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
      const orderEmbed = new EmbedBuilder()
        .setTitle("🎨 Commission Request")
        .setDescription("**Select the type of commission you'd like to order below.**\n\n**Available Commissions:**")
        .setColor(0x00ff00)
        .addFields(
          { name: "🏎️ Livery", value: "Custom livery designs for your vehicles.\n**120 <:Robux:1458316370595942464>**", inline: true },
          { name: "🎯 Logo", value: "Professional logo creation.\n**100 <:Robux:1458316370595942464>**", inline: true },
          { name: "📢 Banner", value: "Eye-catching banner designs.\n**75 <:Robux:1458316370595942464>**", inline: true }
        )
        .setFooter({ text: "Note: You can only have one open order per type at a time. | Payments in Robux only" });

      // Send messages and store IDs
      const sentMessages = [];
      channel.send({ embeds: [welcomeEmbed] })
        .then(message => sentMessages.push(message.id))
        .then(() => channel.send({ embeds: [orderEmbed], components: [row] }))
        .then(message => {
          sentMessages.push(message.id);
          store[channelId] = sentMessages;
          saveMessageStore(store);
        })
        .catch(console.error);
    }
  }
};