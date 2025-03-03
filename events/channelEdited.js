const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const logger = require('../utils/Logger');
const { bot_logs } = require('../database/connection');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'channelUpdate',
    async execute(oldChannel, newChannel) {
        if (newChannel.guild) {
            const logsChannelId = process.env.LOGS_CHANNEL;
            const logsChannel = newChannel.guild.channels.cache.get(logsChannelId);
            if (!logsChannel) {
                logger.warn('Le salon de logs est introuvable.');
                return;
            }

            const auditLogs = await newChannel.guild.fetchAuditLogs({ type: 11, limit: 1 }); // 11 is the integer value for CHANNEL_UPDATE
            const auditEntry = auditLogs.entries.first();
            if (!auditEntry) {
                logger.warn('Aucune entrée de journal d\'audit trouvée pour la modification de salon.');
                return;
            }

            const { executor, target } = auditEntry;
            if (target.id !== newChannel.id) {
                return;
            }

            if (executor.bot) {
                return;
            }

            const [rows] = await bot_logs.query('SELECT user_id FROM whitelist WHERE user_id = ?', [executor.id]);
            const isWhitelisted = rows.length > 0;

            const embed = new EmbedBuilder()
                .setTitle('Salon modifié')
                .setDescription(`Le salon ${newChannel.name} a été modifié par ${executor.tag}.`)
                .setColor('Orange')
                .setTimestamp();

            if (isWhitelisted) {
                logsChannel.send({ embeds: [embed] });
            } else {
                const member = await newChannel.guild.members.fetch(executor.id);

                // Find the role with administrator permissions or the one that allows managing channels
                const roleToRemove = member.roles.cache.find(role => 
                    role.permissions.has(PermissionsBitField.Flags.Administrator) || 
                    role.permissions.has(PermissionsBitField.Flags.ManageChannels)
                );

                if (roleToRemove) {
                    await member.roles.remove(roleToRemove);
                }

                embed.setDescription(`Le salon ${newChannel.name} a été modifié par ${executor.tag} et l'utilisateur a été sanctionné car il n'est pas whitelist.`);
                logsChannel.send({ embeds: [embed] });
            }

            logger.info(`Salon ${newChannel.name} modifié par ${executor.tag}.`);
        }
    }
};