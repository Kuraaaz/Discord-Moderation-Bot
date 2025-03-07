const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { moderationDb } = require('../database/connection');
const logger = require('../utils/Logger');

module.exports = {
    name: 'banlist',
    category: 'moderation',
    permissions: [PermissionsBitField.Flags.BanMembers],
    ownerOnly: false,
    usage: 'banlist',
    examples: ['banlist'],
    description: 'Affiche tous les utilisateurs bannis et softbannis avec la durée de leur bannissement.',
    
    async execute(message, args) {

        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
        }

        try {
            // Fetch all banned users
            const bans = await message.guild.bans.fetch();
            const bannedUsers = bans.map(ban => ({
                tag: ban.user.tag,
                id: ban.user.id,
                reason: ban.reason || 'Aucune raison spécifiée',
                date: ban.user.createdAt
            }));

            // Fetch all softbanned users from the database
            const connection = await moderationDb.getConnection();
            const query = 'SELECT * FROM softbans WHERE guild_id = ?';
            const [softbans] = await connection.query(query, [message.guild.id]);
            connection.release();

            const softbannedUsers = softbans.map(softban => ({
                tag: softban.username,
                id: softban.user_id,
                duration: softban.ban_duration,
                date: softban.ban_time
            }));

            // Create embed for banned users
            const bannedEmbed = new EmbedBuilder()
                .setTitle('Utilisateurs bannis')
                .setColor('Red')
                .setTimestamp();

            if (bannedUsers.length > 0) {
                bannedUsers.forEach(user => {
                    bannedEmbed.addFields(
                        { name: user.tag, value: `ID: ${user.id}\nRaison: ${user.reason}\nDate: ${user.date}`, inline: false }
                    );
                });
            } else {
                bannedEmbed.setDescription('Aucun utilisateur banni.');
            }

            // Create embed for softbanned users
            const softbannedEmbed = new EmbedBuilder()
                .setTitle('Utilisateurs softbannis')
                .setColor('Orange')
                .setTimestamp();

            if (softbannedUsers.length > 0) {
                softbannedUsers.forEach(user => {
                    softbannedEmbed.addFields(
                        { name: user.tag, value: `ID: ${user.id}\nDurée: ${user.duration}\nDate: ${user.date}`, inline: false }
                    );
                });
            } else {
                softbannedEmbed.setDescription('Aucun utilisateur softbanni.');
            }

            // Send embeds to the channel
            message.channel.send({ embeds: [bannedEmbed, softbannedEmbed] });

        } catch (error) {
            logger.error('Erreur lors de la récupération des utilisateurs bannis:', error);
            message.reply('Une erreur est survenue lors de la récupération des utilisateurs bannis.');
        }
    }
};