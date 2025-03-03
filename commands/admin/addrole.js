const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const logger = require('../../utils/Logger');
const { bot_logs } = require('../../database/connection');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'addrole',
    category: 'admin',
    permissions: ['ADMINISTRATOR'],
    ownerOnly: false,
    usage: 'addrole <@user|user_id> <@role|role_id>',
    examples: ['addrole @user @role', 'addrole 1046834138583412856 987654321098765432'],
    description: 'Ajoute un rôle à un utilisateur mentionné ou avec son identifiant.',
    
    async execute(message, args) {
        if (args.length < 2) {
            return message.reply('Merci de mentionner un utilisateur et un rôle ou de fournir leurs identifiants.');
        }

        const userMentionRegex = /^<@!?(\d+)>$/;
        const roleMentionRegex = /^<@&(\d+)>$/;
        let userId, roleId;

        if (userMentionRegex.test(args[0])) {
            userId = args[0].match(userMentionRegex)[1];
        } else if (/^\d+$/.test(args[0])) {
            userId = args[0];
        } else {
            return message.reply('Merci de fournir une mention valide ou un identifiant numérique pour l\'utilisateur.');
        }

        if (roleMentionRegex.test(args[1])) {
            roleId = args[1].match(roleMentionRegex)[1];
        } else if (/^\d+$/.test(args[1])) {
            roleId = args[1];
        } else {
            return message.reply('Merci de fournir une mention valide ou un identifiant numérique pour le rôle.');
        }

        try {
            // Check if the command user is whitelisted
            const [whitelistRows] = await bot_logs.query('SELECT user_id FROM whitelist WHERE user_id = ?', [message.author.id]);
            if (whitelistRows.length === 0) {
                return message.reply('Vous n\'êtes pas autorisé à utiliser cette commande.');
            }

            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
            }

            if (member.roles.cache.has(roleId)) {
                return message.reply('L\'utilisateur possède déjà ce rôle.');
            }

            const member = await message.guild.members.fetch(userId);
            if (!member) {
                return message.reply('Utilisateur introuvable.');
            }

            const role = await message.guild.roles.fetch(roleId);
            if (!role) {
                return message.reply('Rôle introuvable.');
            }

            await member.roles.add(role);

            const embed = new EmbedBuilder()
                .setTitle('Rôle ajouté')
                .setDescription(`Le rôle ${role.name} a été ajouté à ${member.user.tag}.`)
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                .setColor('Green');
            message.channel.send({ embeds: [embed] });

            const logChannelId = process.env.LOGS_MODS_CHANNEL;
            const logChannel = message.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Rôle ajouté')
                    .setDescription(`Le rôle ${role.name} a été ajouté à ${member.user.tag} par ${message.author.tag}.`)
                    .setColor('Green')
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            }

            logger.info(`Rôle ${role.name} ajouté à ${member.user.tag} par ${message.author.tag}`);
        } catch (err) {
            logger.error('Erreur lors de l\'ajout du rôle:', err);
            message.reply('Une erreur est survenue lors de l\'ajout du rôle à l\'utilisateur.');
        }
    }
};