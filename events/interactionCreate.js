import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";
import fs from "fs";
import path from "path";

// Simple swear word list (expand as needed)
const swearWords = ["fuck", "shit", "damn", "bitch", "asshole", "crap"];

function containsSwearWords(text) {
  const lower = text.toLowerCase();
  return swearWords.some(word => lower.includes(word));
}

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
  const mentionMatch = input.match(/^<@!?(\d+)>$/);
  if (mentionMatch) return `<@${mentionMatch[1]}>`;
  const idMatch = input.match(/^(\d{17,19})$/);
  if (idMatch) return `<@${idMatch[1]}>`;
  return input;
}

const ordersFile = path.join(process.cwd(), "orders.json");
const messageStoreFile = path.join(process.cwd(), "message-store.json");

function loadOrders() {
  if (!fs.existsSync(ordersFile)) return {};
  return JSON.parse(fs.readFileSync(ordersFile, "utf8"));
}

function saveOrders(orders) {
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));
}

function loadMessageStore() {
  if (!fs.existsSync(messageStoreFile)) return {};
  return JSON.parse(fs.readFileSync(messageStoreFile, "utf8"));
}

function saveMessageStore(store) {
  fs.writeFileSync(messageStoreFile, JSON.stringify(store, null, 2));
}

const orderPrompts = {
  livery: {
    title: "Livery Order",
    description: "Thanks for ordering a livery! Please answer the questions in the ticket channel so staff can begin."
  },
  logo: {
    title: "Logo Order",
    description: "Thanks for ordering a logo! Please answer the questions in the ticket channel so staff can begin."
  },
  banner: {
    title: "Banner Order",
    description: "Thanks for ordering a banner! Please answer the questions in the ticket channel so staff can begin."
  }
};

export default {
  name: "interactionCreate",
  async execute(interaction, config) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction, config);
      return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === "order_type_select") {
      const selected = interaction.values[0];
      const prompt = orderPrompts[selected];

      const modal = new ModalBuilder()
        .setCustomId(`order_modal_${selected}`)
        .setTitle(`${selected.charAt(0).toUpperCase() + selected.slice(1)} Commission Request`);

      const orderInput = new TextInputBuilder()
        .setCustomId("order_description")
        .setLabel("Describe your order")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Please provide as much detail as possible...")
        .setRequired(true);

      const firstActionRow = new ActionRowBuilder().addComponents(orderInput);

      modal.addComponents(firstActionRow);

      await interaction.showModal(modal);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("order_modal_")) {
      const selected = interaction.customId.split("_")[2];
      const prompt = orderPrompts[selected];
      const description = interaction.fields.getTextInputValue("order_description");

      const guild = interaction.guild;
      if (!guild) {
        await interaction.reply({ content: "This must be used in a server.", flags: 64 });
        return;
      }

      const user = interaction.user;
      const orders = loadOrders();

      // Check if user has an open order for this type
      const userOrders = Object.values(orders).filter(order => order.userId === user.id && order.type === selected);
      const hasOpen = userOrders.some(order => order.status === "open");
      if (hasOpen) {
        await interaction.reply({ content: `You already have an open ${selected} order. Please complete or close it before starting a new one.`, flags: 64 });
        return;
      }

      await interaction.deferReply({ flags: 64 });

      let dmChannel;
      try {
        dmChannel = await user.createDM();
        await dmChannel.send({
          content: `Hello ${user.username}! Your ${selected} commission request has been received. I have created a private ticket channel for you in the server.`
        });
      } catch (error) {
        await interaction.editReply({
          content:
            "I couldn't send you a DM. Please enable server DMs and try again, or ask a staff member for help.",
          flags: 64
        });
        return;
      }

      const category = guild.channels.cache.get(config.orderCategoryId);
      if (!category || category.type !== ChannelType.GuildCategory) {
        await interaction.editReply({
          content: "The order category is not set correctly in config.json. Please ask an admin to fix it.",
          flags: 64
        });
        return;
      }

      const channelName = `${config.orderChannelPrefix}${user.username}`.slice(0, 100);
      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.roles.everyone,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          },
          {
            id: config.staffRoleId,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          }
        ]
      });

      const embed = new EmbedBuilder()
        .setTitle(prompt.title)
        .setDescription(prompt.description)
        .setColor(0x00ff00)
        .addFields(
          { name: "Ticket Owner", value: `${user}`, inline: true },
          { name: "Order Type", value: selected.charAt(0).toUpperCase() + selected.slice(1), inline: true },
          { name: "Status", value: "Open", inline: true },
          { name: "Order Details", value: description || "No details provided", inline: false },
          { name: "Payment Information", value: "⚠️ **Important:** We only accept Robux for payments. Please ensure you have sufficient funds before proceeding with your order.", inline: false }
        )
        .setTimestamp();

      const ticketLogChannel = guild.channels.cache.get(config.ticketLogChannelId);

      // Send embed and store message ID
      const sentEmbed = await ticketChannel.send({ embeds: [embed] });
      const store = loadMessageStore();
      if (!store[ticketChannel.id]) store[ticketChannel.id] = [];
      store[ticketChannel.id].push(sentEmbed.id);
      saveMessageStore(store);
      if (ticketLogChannel?.isTextBased()) {
        await ticketLogChannel.send({
          content: `New order ticket opened by ${user.tag} (${user.id}) in ${ticketChannel}`
        });
      }

      const closeButton = new ButtonBuilder()
        .setCustomId("close_order")
        .setLabel("Close Order")
        .setStyle(ButtonStyle.Primary);

      const forceCloseButton = new ButtonBuilder()
        .setCustomId("force_close")
        .setLabel("🛡️ Force Close")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder().addComponents(closeButton, forceCloseButton);
      const buttonMessage = await ticketChannel.send({ content: "Use the button below when your order is complete or if you need to close the ticket.", components: [row] });
      
      // Store button message ID
      store[ticketChannel.id].push(buttonMessage.id);
      saveMessageStore(store);

      await dmChannel.send({
        content: `Your ticket channel is ready: ${ticketChannel}. Please continue the conversation there.`
      });

      // Save order
      orders[ticketChannel.id] = {
        userId: user.id,
        type: selected,
        status: "open",
        description: description,
        createdAt: new Date().toISOString()
      };
      saveOrders(orders);

      await interaction.editReply({
        content: `A ticket channel has been created and a DM was sent to you. Check your DMs and the server channel ${ticketChannel}.`,
        flags: 64
      });
    }

    if (interaction.isButton() && interaction.customId === "close_order") {
      const channel = interaction.channel;
      if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.reply({ content: "This button can only be used inside a ticket channel.", flags: 64 });
        return;
      }

      const orders = loadOrders();
      const order = orders[channel.id];
      if (!order || interaction.user.id !== order.userId) {
        await interaction.reply({ content: "Only the order owner can close the order.", flags: 64 });
        return;
      }

      // Show review modal
      const modal = new ModalBuilder()
        .setCustomId("review_modal")
        .setTitle("Leave a Review");

      const starsInput = new TextInputBuilder()
        .setCustomId("stars")
        .setLabel("Rating (1-5 stars)")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("e.g., 5")
        .setRequired(true);

      const designerInput = new TextInputBuilder()
        .setCustomId("designer")
        .setLabel("Designer Mention")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder("Mention the designer like <@123456789012345678>")
        .setRequired(true);

      const reviewInput = new TextInputBuilder()
        .setCustomId("review_text")
        .setLabel("Review")
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder("Tell us about your experience...")
        .setRequired(true);

      const firstRow = new ActionRowBuilder().addComponents(starsInput);
      const secondRow = new ActionRowBuilder().addComponents(designerInput);
      const thirdRow = new ActionRowBuilder().addComponents(reviewInput);

      modal.addComponents(firstRow, secondRow, thirdRow);

      await interaction.showModal(modal);
      return;
    }

    if (interaction.isButton() && interaction.customId === "force_close") {
      const channel = interaction.channel;
      if (!channel || channel.type !== ChannelType.GuildText) {
        await interaction.reply({ content: "This button can only be used inside a ticket channel.", flags: 64 });
        return;
      }

      // Check if staff
      const member = interaction.member;
      if (!member.roles.cache.has(config.staffRoleId)) {
        await interaction.reply({ content: "Only staff can force close tickets.", flags: 64 });
        return;
      }

      await interaction.reply({ content: "Force closing the ticket...", flags: 64 });

      // Create transcript
      const messages = await channel.messages.fetch({ limit: 100 });
      const transcript = messages.reverse().map(msg => 
        `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content || '[Embed/Attachment]'}`
      ).join('\n');

      const transcriptPath = path.join(process.cwd(), `transcript-${channel.id}.txt`);
      fs.writeFileSync(transcriptPath, transcript);

      const ticketLogChannel = channel.guild.channels.cache.get(config.ticketLogChannelId);
      if (ticketLogChannel?.isTextBased()) {
        await ticketLogChannel.send({
          content: `Ticket force closed: ${channel.name}`,
          files: [transcriptPath]
        });
      }

      // Clean up transcript file
      fs.unlinkSync(transcriptPath);

      const orders = loadOrders();
      if (orders[channel.id]) {
        orders[channel.id].status = "closed";
        saveOrders(orders);
      }

      await channel.delete("Ticket force closed by staff");
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId === "review_modal") {
      const channel = interaction.channel;
      const orders = loadOrders();
      const order = orders[channel.id];
      if (!order) {
        await interaction.reply({ content: "Order not found.", flags: 64 });
        return;
      }

      const stars = parseInt(interaction.fields.getTextInputValue("stars"));
      const designerMention = interaction.fields.getTextInputValue("designer");
      const reviewText = interaction.fields.getTextInputValue("review_text");

      if (isNaN(stars) || stars < 1 || stars > 5) {
        await interaction.reply({ content: "Invalid rating. Please enter a number between 1 and 5.", flags: 64 });
        return;
      }

      await interaction.deferReply({ flags: 64 });

      // Process review
      const user = interaction.user;
      const guild = interaction.guild;
      const reviewSettings = loadReviewSettings();
      const hasSwear = containsSwearWords(reviewText);
      const autoApprove = reviewSettings.autoApprove && !hasSwear;
      const reviewedBy = autoApprove ? "Bot (Auto-approved)" : "Pending Staff Review";
      const designerValue = resolveDesignerMention(designerMention);

      const embed = new EmbedBuilder()
        .setTitle(`Review for ${order.type.charAt(0).toUpperCase() + order.type.slice(1)} Commission`)
        .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
        .addFields(
          { name: "Rating", value: "⭐".repeat(stars), inline: true },
          { name: "Designer", value: designerValue, inline: true },
          { name: "Review", value: reviewText, inline: false }
        )
        .setColor(autoApprove ? 0x00ff00 : 0xffa500)
        .setTimestamp()
        .setFooter({ text: `Reviewed by: ${reviewedBy}` });

      let reviewChannel = guild.channels.cache.get(config.reviewChannelId || "1474017092352217280");
      if (!reviewChannel) {
        reviewChannel = await guild.channels.fetch(config.reviewChannelId || "1474017092352217280").catch(() => null);
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
      }

      // Save review
      const reviews = loadReviews();
      const reviewId = Date.now().toString();
      reviews[reviewId] = {
        userId: user.id,
        type: order.type,
        stars,
        designer: designerValue,
        review: reviewText,
        hasSwear,
        reviewedBy,
        autoApprove,
        timestamp: new Date().toISOString(),
        messageId: pendingMessage?.id || null
      };
      saveReviews(reviews);

      // Now close the ticket
      // Create transcript
      const messages = await channel.messages.fetch({ limit: 100 });
      const transcript = messages.reverse().map(msg => 
        `[${msg.createdAt.toISOString()}] ${msg.author.tag}: ${msg.content || '[Embed/Attachment]'}`
      ).join('\n');

      const transcriptPath = path.join(process.cwd(), `transcript-${channel.id}.txt`);
      fs.writeFileSync(transcriptPath, transcript);

      const ticketLogChannel = guild.channels.cache.get(config.ticketLogChannelId);
      if (ticketLogChannel?.isTextBased()) {
        await ticketLogChannel.send({
          content: `Ticket closed: ${channel.name}`,
          files: [transcriptPath]
        });
      }

      // Clean up transcript file
      fs.unlinkSync(transcriptPath);

      orders[channel.id].status = "closed";
      saveOrders(orders);

      // Update the embed to show closed
      const embedMessage = await channel.messages.fetch({ limit: 1 }).then(msgs => msgs.first());
      if (embedMessage && embedMessage.embeds.length > 0) {
        const embed = embedMessage.embeds[0];
        const updatedEmbed = EmbedBuilder.from(embed).setColor(0xff0000).setFields(
          embed.fields.map(field => 
            field.name === "Status" ? { ...field, value: "Closed" } : field
          )
        );
        await embedMessage.edit({ embeds: [updatedEmbed], components: [] });
      }

      await channel.send({ content: "This ticket has been closed. Thank you for your review!" });

      // Delete channel after 15 seconds
      setTimeout(() => {
        channel.delete("Ticket closed and archived").catch(console.error);
      }, 15000);

      await interaction.editReply({ content: "Review submitted and ticket closed. Thank you!", flags: 64 });
    }
  }
};
