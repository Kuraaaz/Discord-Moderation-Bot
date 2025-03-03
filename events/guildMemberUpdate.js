const { EmbedBuilder } = require('discord.js');
const logger = require('../utils/Logger');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'guildMemberUpdate',
    async execute(oldMember, newMember) {
        const logsChannelId = process.env.LOGS_CHANNEL;
        const logsChannel = newMember.guild.channels.cache.get(logsChannelId);
        if (!logsChannel) {
            logger.warn('Le salon de logs est introuvable.');
            return;
        }

        let changes = '';

        // Check for nickname change
        if (oldMember.nickname !== newMember.nickname) {
            changes += `**Surnom:** ${oldMember.nickname || oldMember.user.username} ➔ ${newMember.nickname || newMember.user.username}\n`;
        }

        // Check for role changes
        const oldRoles = oldMember.roles.cache.map(role => role.name);
        const newRoles = newMember.roles.cache.map(role => role.name);
        const addedRoles = newRoles.filter(role => !oldRoles.includes(role));
        const removedRoles = oldRoles.filter(role => !newRoles.includes(role));

        if (addedRoles.length > 0) {
            changes += `**Rôles ajoutés:** ${addedRoles.join(', ')}\n`;
        }
        if (removedRoles.length > 0) {
            changes += `**Rôles retirés:** ${removedRoles.join(', ')}\n`;
        }

        // Check for avatar change
        if (oldMember.user.avatar !== newMember.user.avatar) {
            changes += `**Avatar changé**\n`;
        }

        if (changes) {
            const embed = new EmbedBuilder()
                .setTitle('Membre mis à jour')
                .setDescription(`Les informations de ${newMember.user.tag} ont été mises à jour.`)
                .addFields(
                    { name: 'Changements', value: changes }
                )
                .setColor('Blue')
                .setTimestamp();

            logsChannel.send({ embeds: [embed] });
            logger.info(`Membre ${newMember.user.tag} mis à jour: ${changes}`);
        }
    }
};