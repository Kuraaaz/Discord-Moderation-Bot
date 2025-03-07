const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
    name: 'messageDelete',
    async execute(message) {
        if (message.author.bot) return;

        const logsChannelId = process.env.LOGS_MODS_CHANNEL;
        const logsChannel = message.guild.channels.cache.get(logsChannelId);

        if (!logsChannel) {
            console.error(`Logs channel with ID ${logsChannelId} not found`);
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('Message Supprimé')
            .setColor('#FF0000')
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setDescription(message.content)
            .addFields(
                { name: 'Auteur', value: message.author.tag, inline: true },
                { name: 'Date', value: message.createdAt.toDateString(), inline: true }
            )
            .setTimestamp();

        logsChannel.send({ embeds: [embed] });
    }
};