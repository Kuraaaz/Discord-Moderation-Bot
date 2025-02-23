const { EmbedBuilder } = require('discord.js');
const { moderationDb } = require('../database/connection'); // Assurez-vous d'importer correctement
const logger = require('../utils/Logger');

module.exports = {
    name: 'timeout',
    category: 'moderation',
    permissions: ['MODERATE_MEMBERS'],
    ownerOnly: false,
    usage: 'timeout <@user> <duration>',
    examples: ['timeout @user 10m', 'timeout @user 1h', 'timeout @user 7d'],
    description: 'Timeout a member for a specified duration',
    
    async execute(message, args) {
        if (!message.mentions.members.size) {
            return message.reply('Merci de mentionner un utilisateur à rendre muet.');
        }

        const member = message.mentions.members.first();
        const durationString = args[1];
        const duration = parseDuration(durationString);

        if (duration === null || duration < 60 * 1000 || duration > 7 * 24 * 60 * 60 * 1000) {
            return message.reply('Merci de spécifier une durée valide entre 60 secondes et 7 jours (ex: 10m, 1h, 7d).');
        }

        const timeoutTime = new Date();
        const timeoutDuration = duration; // Duration in milliseconds

        await member.timeout(duration);
        const embed = new EmbedBuilder()
            .setTitle('Utilisateur rendu muet')
            .setDescription(`${member} a été rendu muet pour ${durationString}.`)
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
            .setColor('Red');
        message.channel.send({ embeds: [embed] });

        // Store the timeout information in the database
        const query = 'INSERT INTO timeouts (user_id, username, guild_id, timeout_time, timeout_duration) VALUES (?, ?, ?, ?, ?)';
        try {
            await moderationDb.execute(query, [member.id, member.user.tag, message.guild.id, timeoutTime, timeoutDuration]);
        } catch (err) {
            logger.error('Échec de l\'enregistrement des informations de timeout:', err);
        }

        // Schedule unmute
        setTimeout(async () => {
            await member.timeout(null); // Remove timeout
            message.channel.send(`${member.user.tag} a été rétabli.`);

            // Remove the timeout information from the database
            const deleteQuery = 'DELETE FROM timeouts WHERE user_id = ?';
            try {
                await moderationDb.execute(deleteQuery, [member.id]);
            } catch (err) {
                logger.error('Échec de la suppression des informations de timeout:', err);
            }
        }, timeoutDuration);
    }
};

function parseDuration(durationString) {
    const match = durationString.match(/^(\d+)([smhd])$/);
    if (!match) return null;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case 's': return value * 1000; // seconds to milliseconds
        case 'm': return value * 60 * 1000; // minutes to milliseconds
        case 'h': return value * 60 * 60 * 1000; // hours to milliseconds
        case 'd': return value * 24 * 60 * 60 * 1000; // days to milliseconds
        default: return null;
    }
}
