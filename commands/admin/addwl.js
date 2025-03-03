const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const logger = require('../../utils/Logger');
const { bot_logs } = require('../../database/connection');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'addwl',
    category: 'admin',
    permissions: ['ADMINISTRATOR'],
    ownerOnly: false,
    usage: 'addwl <@user|user_id>',
    examples: ['addwl @user', 'addwl 1046834138583412856'],
    description: 'Ajoute un utilisateur à la whitelist en lui conférant un rôle spécifique.',
    
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

            // Check if the command user is whitelisted or is the owner
            if (!isOwner) {
                const [whitelistRows] = await bot_logs.query('SELECT user_id FROM whitelist WHERE user_id = ?', [message.author.id]);
                if (whitelistRows.length === 0) {
                    return message.reply('Vous n\'êtes pas autorisé à utiliser cette commande.');
                }
            }

            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                        return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
                    }

            const member = await message.guild.members.fetch(userId);
            if (!member) {
                return message.reply('Utilisateur introuvable.');
            }

            // Check if the command user has a higher role than the target user or is the owner
            if (!isOwner && message.member.roles.highest.position <= member.roles.highest.position) {
                return message.reply('Vous ne pouvez pas utiliser cette commande sur un membre ayant un rôle supérieur ou égal au vôtre.');
            }

            // Check if the user is already in the whitelist
            const [rows] = await bot_logs.query('SELECT user_id FROM whitelist WHERE user_id = ?', [userId]);
            if (rows.length > 0) {
                return message.reply('Cet utilisateur est déjà dans la whitelist.');
            }

            const embed = new EmbedBuilder()
                .setTitle('Utilisateur ajouté à la whitelist')
                .setDescription(`${member.user.tag} a été ajouté à la whitelist.`)
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                .setColor('Green');
            message.channel.send({ embeds: [embed] });

            const logChannelId = process.env.LOGS_CHANNEL;
            const logChannel = message.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Utilisateur ajouté à la whitelist')
                    .setDescription(`${member.user.tag} a été ajouté à la whitelist par ${message.author.tag}.`)
                    .setColor('Green')
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            }

            // Insert the user into the whitelist database
            await bot_logs.query('INSERT INTO whitelist (user_id, added_by) VALUES (?, ?)', [userId, message.author.id]);

            logger.info(`Utilisateur ${member.user.tag} ajouté à la whitelist par ${message.author.tag}`);
        } catch (err) {
            logger.error('Erreur lors de l\'ajout à la whitelist:', err);
            message.reply('Une erreur est survenue lors de l\'ajout de l\'utilisateur à la whitelist.');
        }
    }
};