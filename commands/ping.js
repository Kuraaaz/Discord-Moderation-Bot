const { EmbedBuilder } = require("discord.js");
const logger = require('../utils/Logger');

module.exports = {
  name: "ping",
  category: "utils",
  permissions: ["SEND_MESSAGES"],
  ownerOnly: false,
  usage: "ping",
  examples: ["ping"],
  description: "La commande ping renvoie la latence du bot et de l'API",
  
  async execute(message, args) {
    const tryPong = await message.reply("On essaye de pong... un instant!");

    const embed = new EmbedBuilder()
      .setTitle("Pong! 🏓")
      .setThumbnail(message.client.user.displayAvatarURL())
      .addFields(
        {
          name: "Latence API",
          value: `\`\`\`${message.client.ws.ping}ms\`\`\``,
          inline: true,
        },
        {
          name: "Latence BOT",
          value: `\`\`\`${tryPong.createdTimestamp - message.createdTimestamp}ms\`\`\``,
          inline: true,
        }
      )
      .setTimestamp()
      .setFooter({
        text: message.author.username,
        iconURL: message.author.displayAvatarURL(),
      });

    tryPong.edit({ content: " ", embeds: [embed] });
    logger.info('Ping command executed');
  },
};