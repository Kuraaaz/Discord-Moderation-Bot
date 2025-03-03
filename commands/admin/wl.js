const { EmbedBuilder } = require('discord.js');
const logger = require('../../utils/Logger');
const { bot_logs } = require('../../database/connection');

module.exports = {
    name: 'wl',
    category: 'admin',
    permissions: ['ADMINISTRATOR'],
    ownerOnly: false,
    usage: 'wl',
    examples: ['wl'],
    description: 'Affiche tous les utilisateurs présents dans la whitelist.',
    
    async execute(message) {
        try {
            const [rows] = await bot_logs.query('SELECT user_id FROM whitelist');
            if (rows.length === 0) {
                return message.reply('La whitelist est vide.');
            }

            const userIds = rows.map(row => row.user_id);
            const users = await Promise.all(userIds.map(id => message.guild.members.fetch(id).catch(() => null)));
            const userTags = users.filter(user => user).map(user => user.user.tag);

            const embed = new EmbedBuilder()
                .setTitle('Whitelist')
                .setDescription(userTags.join('\n'))
                .setColor('Green');
            message.channel.send({ embeds: [embed] });

            logger.info('Affichage de la whitelist.');
        } catch (err) {
            logger.error('Erreur lors de l\'affichage de la whitelist:', err);
            message.reply('Une erreur est survenue lors de l\'affichage de la whitelist.');
        }
    }
};