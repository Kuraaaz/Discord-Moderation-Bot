const { EmbedBuilder } = require('discord.js');
const logger = require('../../utils/Logger');
const { bot_logs } = require('../../database/connection');

module.exports = {
    name: 'bl',
    category: 'admin',
    permissions: ['ADMINISTRATOR'],
    ownerOnly: false,
    usage: 'bl',
    examples: ['bl'],
    description: 'Affiche tous les utilisateurs présents dans la blacklist.',
    
    async execute(message) {
        try {
            const [rows] = await bot_logs.query('SELECT user_id FROM blacklist');
            if (rows.length === 0) {
                return message.reply('La blacklist est vide.');
            }

            const userIds = rows.map(row => row.user_id);
            const users = await Promise.all(userIds.map(id => message.guild.members.fetch(id).catch(() => null)));
            const userTags = users.filter(user => user).map(user => user.user.tag);

            const embed = new EmbedBuilder()
                .setTitle('Blacklist')
                .setDescription(userTags.join('\n'))
                .setColor('Red');
            message.channel.send({ embeds: [embed] });

            logger.info('Affichage de la blacklist.');
        } catch (err) {
            logger.error('Erreur lors de l\'affichage de la blacklist:', err);
            message.reply('Une erreur est survenue lors de l\'affichage de la blacklist.');
        }
    }
};