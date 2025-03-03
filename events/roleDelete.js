const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/Logger');
const { bot_logs } = require('../database/connection');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'roleDelete',
    async execute(role) {
        if (role.guild) {
            const logsChannelId = process.env.LOGS_CHANNEL;
            const logsChannel = role.guild.channels.cache.get(logsChannelId);
            if (!logsChannel) {
                logger.warn('Le salon de logs est introuvable.');
                return;
            }

            const auditLogs = await role.guild.fetchAuditLogs({ type: 32, limit: 1 });
            const auditEntry = auditLogs.entries.first();
            if (!auditEntry) {
                logger.warn('Aucune entrée de journal d\'audit trouvée pour la suppression de rôle.');
                return;
            }

            const { executor, target } = auditEntry;
            if (target.id !== role.id) {
                return;
            }

            if (executor.bot) {
                return;
            }

            // Check if the executor is whitelisted
            const [whitelistRows] = await bot_logs.query('SELECT user_id FROM whitelist WHERE user_id = ?', [executor.id]);
            const isWhitelisted = whitelistRows.length > 0;

            if (!isWhitelisted) {
                // Recreate the role with the same properties
                const newRole = await role.guild.roles.create({
                    name: role.name,
                    color: role.color,
                    permissions: role.permissions,
                    hoist: role.hoist,
                    mentionable: role.mentionable,
                    position: role.position
                });

                const embed = new EmbedBuilder()
                    .setTitle('Rôle recréé')
                    .setDescription(`Le rôle ${role.name} a été recréé car il a été supprimé par ${executor.tag} qui n'est pas whitelisté.`)
                    .setColor('Red')
                    .setTimestamp();

                logsChannel.send({ embeds: [embed] });

                logger.info(`Rôle ${role.name} recréé car il a été supprimé par ${executor.tag} qui n'est pas whitelisté.`);
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('Rôle supprimé')
                .setDescription(`Le rôle ${role.name} a été supprimé par ${executor.tag}.`)
                .addFields(
                    { name: 'Nom', value: role.name, inline: true },
                    { name: 'Couleur', value: role.color.toString(16), inline: true },
                    { name: 'Permissions', value: role.permissions.bitfield.toString(), inline: true },
                    { name: 'Affiché séparément', value: role.hoist ? 'Oui' : 'Non', inline: true },
                    { name: 'Mentionnable', value: role.mentionable ? 'Oui' : 'Non', inline: true }
                )
                .setColor('Red')
                .setTimestamp();

            logsChannel.send({ embeds: [embed] });

            logger.info(`Rôle ${role.name} supprimé par ${executor.tag}.`);
        }
    }
};