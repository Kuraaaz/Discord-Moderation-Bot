const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const logger = require('../utils/Logger');
const { bot_logs } = require('../database/connection');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'channelDelete',
    async execute(channel) {
        if (channel.guild) {
            const logsChannelId = process.env.LOGS_CHANNEL;
            const logsChannel = channel.guild.channels.cache.get(logsChannelId);
            if (!logsChannel) {
                logger.warn('Le salon de logs est introuvable.');
                return;
            }

            const auditLogs = await channel.guild.fetchAuditLogs({ type: 12, limit: 1 }); // 12 is the integer value for CHANNEL_DELETE
            const auditEntry = auditLogs.entries.first();
            if (!auditEntry) {
                logger.warn('Aucune entrée de journal d\'audit trouvée pour la suppression de salon.');
                return;
            }

            const { executor, target } = auditEntry;
            if (target.id !== channel.id) {
                return;
            }

            if (executor.bot) {
                return;
            }

            const [rows] = await bot_logs.query('SELECT user_id FROM whitelist WHERE user_id = ?', [executor.id]);
            const isWhitelisted = rows.length > 0;

            const embed = new EmbedBuilder()
                .setTitle('Salon supprimé')
                .setDescription(`Le salon ${channel.name} a été supprimé par ${executor.tag}.`)
                .setColor('Red')
                .setTimestamp();

            if (isWhitelisted) {
                logsChannel.send({ embeds: [embed] });
            } else {
                const member = await channel.guild.members.fetch(executor.id);

                // Find the role with administrator permissions or the one that allows deleting channels
                const roleToRemove = member.roles.cache.find(role => 
                    role.permissions.has(PermissionsBitField.Flags.Administrator) || 
                    role.permissions.has(PermissionsBitField.Flags.ManageChannels)
                );

                if (roleToRemove) {
                    await member.roles.remove(roleToRemove);
                }

                embed.setDescription(`Le salon ${channel.name} a été supprimé par ${executor.tag} et l'utilisateur a été sanctionné car il n'est pas whitelist.`);
                logsChannel.send({ embeds: [embed] });
            }

            logger.info(`Salon ${channel.name} supprimé par ${executor.tag}.`);
        }
    }
};