const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { moderationDb } = require('../database/connection');
const logger = require('../utils/Logger');

module.exports = {
    name: 'softban',
    category: 'moderation',
    permissions: [PermissionsBitField.Flags.BanMembers],
    ownerOnly: false,
    usage: 'softban <@user|user_id> <duration>',
    examples: ['softban @user 1h', 'softban 1046834138583412856 2d'],
    description: 'Softban un utilisateur pour un temps spécifié.',
    
    async execute(message, args) {

        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
        }

        if (!args[0]) {
            return message.reply('Merci de spécifier un utilisateur à softban.');
        }

        let userId = args[0].replace(/<@!?(\d+)>/, '$1'); // Extrait l'ID même si c'est une mention
        let member;

        try {
            member = await message.guild.members.fetch(userId);
        } catch (error) {
            return message.reply('Impossible de trouver cet utilisateur sur le serveur.');
        }

        if (!member) {
            return message.reply('Utilisateur introuvable.');
        }

        // Vérification de la durée
        const durationString = args[1];
        if (!durationString) {
            return message.reply('Merci de spécifier une durée pour le softban (ex: 1h, 2d).');
        }
        const duration = parseDuration(durationString);
        if (duration === null) {
            return message.reply('Merci de spécifier une durée valide (ex: 1h, 2d).');
        }

        const banTime = new Date();

        try {
            // Connexion à la base de données
            const connection = await moderationDb.getConnection();
            const selectBanQuery = 'SELECT * FROM softbans WHERE user_id = ? AND guild_id = ?';
            const [banResults] = await connection.query(selectBanQuery, [member.id, message.guild.id]);

            if (banResults.length > 0) {
                connection.release();
                return message.reply('Cet utilisateur est déjà softbanni.');
            }

            // Softban de l'utilisateur
            await member.ban({ reason: 'Softban temporaire' });

            // Envoi de l'embed de confirmation
            const embed = new EmbedBuilder()
                .setTitle('Utilisateur softbanni')
                .setDescription(`${member.user.tag} a été softbanni du serveur pour ${durationString}.`)
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                .setColor('Red');
            message.channel.send({ embeds: [embed] });

            const logChannelId = process.env.LOGS_MODS_CHANNEL;
        const logChannel = message.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                .setTitle('Utilisateur softbanni')
                .setDescription(`${member.user.tag} a été softbanni du serveur pour ${durationString}.`)
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                .setColor('Red');
            logChannel.send({ embeds: [logEmbed] });
            }

            // Insertion dans la table softbans
            const query = 'INSERT INTO softbans (user_id, username, ban_time, ban_duration, guild_id, guild_name, executor_id, executor_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            await connection.query(query, [member.id, member.user.tag, banTime, duration, message.guild.id, message.guild.name, message.author.id, message.author.tag]);

            connection.release();

            // Planifier le débannissement après la durée spécifiée
            setTimeout(async () => {
                try {
                    await message.guild.members.unban(member.id);
                    message.channel.send(`${member.user.tag} a été débanni.`);
                    
                    const connection2 = await moderationDb.getConnection();
                    const deleteQuery = 'DELETE FROM softbans WHERE user_id = ? AND guild_id = ?';
                    await connection2.query(deleteQuery, [member.id, message.guild.id]);
                    connection2.release();
                } catch (err) {
                    logger.error('Échec du débannissement automatique:', err);
                }
            }, duration);
        } catch (err) {
            logger.error('Erreur avec la connexion MySQL:', err);
            message.reply('Une erreur est survenue avec la base de données.');
        }
    }
};

function parseDuration(durationString) {
    const match = durationString.match(/^(\d+)([mhd])$/);
    if (!match) return null;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        default: return null;
    }
}
