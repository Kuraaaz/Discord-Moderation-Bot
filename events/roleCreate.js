const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/Logger');
const { bot_logs } = require('../database/connection');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'roleCreate',
    async execute(role) {
        if (role.guild) {
            const logsChannelId = process.env.LOGS_CHANNEL;
            const logsChannel = role.guild.channels.cache.get(logsChannelId);
            if (!logsChannel) {
                logger.warn('Le salon de logs est introuvable.');
                return;
            }

            const auditLogs = await role.guild.fetchAuditLogs({ type: 30, limit: 1 }); // 30 is the integer value for ROLE_CREATE
            const auditEntry = auditLogs.entries.first();
            if (!auditEntry) {
                logger.warn('Aucune entrée de journal d\'audit trouvée pour la création de rôle.');
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
                await role.delete('Rôle créé par un utilisateur non whitelisté');

                const embed = new EmbedBuilder()
                    .setTitle('Rôle crée (supprimé)')
                    .setDescription(`Le rôle ${role.name} a été supprimé car il a été créé par ${executor.tag} qui n'est pas whitelisté.`)
                    .setColor('Red')
                    .setTimestamp();

                logsChannel.send({ embeds: [embed] });

                logger.info(`Rôle ${role.name} supprimé car il a été créé par ${executor.tag} qui n'est pas whitelisté.`);
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('Rôle créé')
                .setDescription(`Le rôle ${role.name} a été créé par ${executor.tag}.`)
                .addFields(
                    { name: 'Nom', value: role.name, inline: true },
                    { name: 'Couleur', value: role.color.toString(16), inline: true },
                    { name: 'Permissions', value: role.permissions.bitfield.toString(), inline: true },
                    { name: 'Affiché séparément', value: role.hoist ? 'Oui' : 'Non', inline: true },
                    { name: 'Mentionnable', value: role.mentionable ? 'Oui' : 'Non', inline: true }
                )
                .setColor('Green')
                .setTimestamp();

            logsChannel.send({ embeds: [embed] });

            logger.info(`Rôle ${role.name} créé par ${executor.tag}.`);
        }
    }
};