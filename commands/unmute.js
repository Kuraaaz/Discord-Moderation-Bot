const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { moderationDb } = require('../database/connection');
const logger = require('../utils/Logger');

module.exports = {
    name: 'unmute',
    category: 'moderation',
    permissions: [PermissionsBitField.Flags.ManageRoles],
    ownerOnly: false,
    usage: 'unmute <@user>',
    examples: ['unmute @user'],
    description: 'Unmute a member and remove them from the timeout database',
    
    async execute(message, args) {

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
            return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
        }

        if (!message.mentions.members.size) {
            return message.reply('Merci de mentionner un utilisateur à rétablir.');
        }

        const member = message.mentions.members.first();

        try {
            // Remove timeout
            await member.timeout(null);
            const embed = new EmbedBuilder()
                .setTitle('Utilisateur rétabli')
                .setDescription(`${member.user.tag} a été rétabli.`)
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                .setColor('Green');
            message.channel.send({ embeds: [embed] });

            const logChannelId = process.env.LOGS_MODS_CHANNEL;
            const logChannel = message.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                .setTitle('Utilisateur rétabli')
                .setDescription(`${member.user.tag} a été rétabli.`)
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                .setColor('Green');
            logChannel.send({ embeds: [logEmbed] });
            }

            // Remove the timeout information from the database
            const deleteQuery = 'DELETE FROM timeouts WHERE user_id = ?';
            await moderationDb.execute(deleteQuery, [member.id]);

        } catch (err) {
            logger.error('Échec de la suppression des informations de timeout:', err);
            message.reply('Une erreur est survenue lors de la tentative de rétablissement de l\'utilisateur.');
        }
    }
};