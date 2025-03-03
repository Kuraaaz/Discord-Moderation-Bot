const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/Logger');
const { bot_logs } = require('../database/connection');
const dotenv = require('dotenv');
dotenv.config();

// Fonction utilitaire pour attendre un délai en millisecondes
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    name: 'roleUpdate',
    async execute(oldRole, newRole) {
        if (newRole.guild) {
            const logsChannelId = process.env.LOGS_CHANNEL;
            const logsChannel = newRole.guild.channels.cache.get(logsChannelId);
            if (!logsChannel) {
                logger.warn('Le salon de logs est introuvable.');
                return;
            }

            const auditLogs = await newRole.guild.fetchAuditLogs({ type: 31, limit: 1 });
            const auditEntry = auditLogs.entries.first();
            if (!auditEntry) {
                logger.warn('Aucune entrée de journal d\'audit trouvée pour la modification de rôle.');
                return;
            }

            const { executor, target } = auditEntry;
            if (target.id !== newRole.id) {
                return;
            }

            if (executor.bot) {
                return;
            }

            // Vérification dans la whitelist
            const [whitelistRows] = await bot_logs.query('SELECT user_id FROM whitelist WHERE user_id = ?', [executor.id]);
            const isWhitelisted = whitelistRows.length > 0;

            if (!isWhitelisted) {
                try {
                    const oldPosition = oldRole.position;

                    // Rétablir les propriétés initiales du rôle
                    await newRole.edit({
                        name: oldRole.name,
                        color: oldRole.color,
                        permissions: oldRole.permissions,
                        hoist: oldRole.hoist,
                        mentionable: oldRole.mentionable
                    });

                    // Attendre un court délai pour que les changements soient propagés
                    await delay(1000);

                    // Réinitialiser la position du rôle
                    await newRole.setPosition(oldPosition);

                    const embed = new EmbedBuilder()
                        .setTitle('Modification de rôle annulée')
                        .setDescription(`Le rôle ${oldRole.name} a été modifié par ${executor.tag} qui n'est pas whitelisté. Les modifications ont été annulées et le rôle a retrouvé sa position d'origine.`)
                        .setColor('Red')
                        .setTimestamp();

                    logsChannel.send({ embeds: [embed] });
                    logger.info(`Modifications du rôle ${oldRole.name} par ${executor.tag} annulées car il n'est pas whitelisté.`);
                } catch (error) {
                    logger.error('Erreur lors de la restauration du rôle:', error);
                }
                return;
            }

            // Si l'utilisateur est whitelisté, on affiche simplement les modifications
            let changes = '';
            if (oldRole.name !== newRole.name) {
                changes += `**Nom:** ${oldRole.name} ➔ ${newRole.name}\n`;
            }
            if (oldRole.color !== newRole.color) {
                changes += `**Couleur:** ${oldRole.color.toString(16)} ➔ ${newRole.color.toString(16)}\n`;
            }
            if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) {
                changes += `**Permissions:** ${oldRole.permissions.bitfield} ➔ ${newRole.permissions.bitfield}\n`;
            }
            if (oldRole.hoist !== newRole.hoist) {
                changes += `**Affiché séparément:** ${oldRole.hoist} ➔ ${newRole.hoist}\n`;
            }
            if (oldRole.mentionable !== newRole.mentionable) {
                changes += `**Mentionnable:** ${oldRole.mentionable} ➔ ${newRole.mentionable}\n`;
            }

            const embed = new EmbedBuilder()
                .setTitle('Rôle modifié')
                .setDescription(`Le rôle ${oldRole.name} a été modifié par ${executor.tag}.`)
                .addFields(
                    { name: 'Ancienne version', value: oldRole.name, inline: true },
                    { name: 'Nouvelle version', value: newRole.name, inline: true },
                    { name: 'Changements', value: changes || 'Aucun changement détecté', inline: false }
                )
                .setColor('Orange')
                .setTimestamp();

            logsChannel.send({ embeds: [embed] });
            logger.info(`Rôle ${oldRole.name} modifié par ${executor.tag}.`);
        }
    }
};
