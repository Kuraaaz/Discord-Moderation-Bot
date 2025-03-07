const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { moderationDb } = require('../database/connection');
const logger = require('../utils/Logger');

module.exports = {
    name: 'ban',
    category: 'moderation',
    permissions: [PermissionsBitField.Flags.BanMembers],
    ownerOnly: false,
    usage: 'ban <@user>',
    examples: ['ban @user'],
    description: 'Banni un membre du serveur.',
    
    async execute(message, args) {

        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
        }

        if (!message.mentions.members.size) {
            return message.reply('Merci de mentionner un utilisateur à bannir.');
        }

        const member = message.mentions.members.first();
        if (!member.bannable) {
            return message.reply('Je ne peux pas bannir cet utilisateur.');
        }

        try {
            // Bannir l'utilisateur
            await member.ban();
            const embed = new EmbedBuilder()
                .setTitle('Utilisateur banni')
                .setDescription(`${member.user.tag} a été banni définitivement du serveur.`)
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                .setColor('Red');
            message.channel.send({ embeds: [embed] });

            const logChannelId = process.env.LOGS_MODS_CHANNEL;
        const logChannel = message.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                .setTitle('Utilisateur banni')
                .setDescription(`${member.user.tag} a été banni définitivement du serveur.`)
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                .setColor('Red');
            logChannel.send({ embeds: [logEmbed] });
            }

            const banDate = new Date();

            // Connexion à la base de données
            const connection = await moderationDb.getConnection();
            const selectQuery = 'SELECT * FROM bans WHERE user_id = ? AND guild_id = ?';
            const [results] = await connection.query(selectQuery, [member.id, message.guild.id]);

            if (results.length > 0) {
                // L'utilisateur existe, mise à jour du compte de bannissement
                const updateQuery = 'UPDATE bans SET ban_date = ?, ban_count = ban_count + 1, executor_id = ?, executor_name = ? WHERE user_id = ? AND guild_id = ?';
                await connection.query(updateQuery, [banDate, message.author.id, message.author.tag, member.id, message.guild.id]);
            } else {
                // L'utilisateur n'existe pas, insertion de nouvelles données
                const insertQuery = 'INSERT INTO bans (user_id, username, ban_date, ban_count, guild_id, guild_name, executor_id, executor_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
                await connection.query(insertQuery, [member.id, member.user.tag, banDate, 1, message.guild.id, message.guild.name, message.author.id, message.author.tag]);
            }

            connection.release();
        } catch (err) {
            logger.error('Erreur lors du bannissement:', err);
            message.reply('Une erreur est survenue lors du bannissement de l\'utilisateur.');
        }
    }
};
