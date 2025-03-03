const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const logger = require('../../utils/Logger');
const { bot_logs } = require('../../database/connection');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'delbl',
    category: 'admin',
    permissions: ['ADMINISTRATOR'],
    ownerOnly: false,
    usage: 'delbl <@user|user_id>',
    examples: ['delbl @user', 'delbl 1046834138583412856'],
    description: 'Supprime un utilisateur de la blacklist en lui retirant un rôle spécifique.',
    
    async execute(message, args) {
        if (!args.length) {
            return message.reply('Merci de mentionner un utilisateur ou de fournir un identifiant.');
        }

        const mentionRegex = /^<@!?(\d+)>$/;
        let userId;
        if (mentionRegex.test(args[0])) {
            userId = args[0].match(mentionRegex)[1];
        } else if (/^\d+$/.test(args[0])) {
            userId = args[0];
        } else {
            return message.reply('Merci de fournir une mention valide ou un identifiant numérique.');
        }

        try {
            const isOwner = message.author.id === process.env.OWNER_ID;

            let member;
            try {
                member = await message.guild.members.fetch(userId);
            } catch (err) {
                if (err.code !== 10007) { // 10007 is the error code for "Unknown Member"
                    throw err;
                }
            }

            // Check if the command user has a higher role than the target user or is the owner
            if (member && !isOwner && message.member.roles.highest.position <= member.roles.highest.position) {
                return message.reply('Vous ne pouvez pas utiliser cette commande sur un membre ayant un rôle supérieur ou égal au vôtre.');
            }

            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                        return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
            }

            // Check if the user is in the blacklist
            const [rows] = await bot_logs.query('SELECT user_id FROM blacklist WHERE user_id = ?', [userId]);
            if (rows.length === 0) {
                return message.reply('Ce membre n\'est pas blacklisté.');
            }

            const embed = new EmbedBuilder()
                .setTitle('Utilisateur retiré de la blacklist')
                .setDescription(`${userId} a été retiré de la blacklist.`)
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                .setColor('Yellow');
            message.channel.send({ embeds: [embed] });

            const logChannelId = process.env.LOGS_CHANNEL;
            const logChannel = message.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Utilisateur supprimé de la blacklist')
                    .setDescription(`${userId} a été supprimé de la blacklist par ${message.author.tag}.`)
                    .setColor('Red')
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            }

            // Remove the user from the blacklist database
            await bot_logs.query('DELETE FROM blacklist WHERE user_id = ?', [userId]);

            logger.info(`Utilisateur ${userId} retiré de la blacklist par ${message.author.tag}`);
        } catch (err) {
            console.log('Erreur lors du retrait de la blacklist:', err);
            message.reply('Une erreur est survenue lors du retrait de l\'utilisateur de la blacklist.');
        }
    }
};