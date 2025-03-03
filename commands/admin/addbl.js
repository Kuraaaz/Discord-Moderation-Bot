const { EmbedBuilder } = require('discord.js');
const logger = require('../../utils/Logger');

module.exports = {
    name: 'addbl',
    category: 'admin',
    permissions: ['MANAGE_ROLES'],
    ownerOnly: false,
    usage: 'addbl <@user|user_id>',
    examples: ['addbl @user', 'addbl 1046834138583412856'],
    description: 'Ajoute un utilisateur à la blacklist en lui conférant un rôle spécifique.',
    
    async execute(message, args) {
        if (!args.length) {
            return message.reply('Merci de mentionner un utilisateur ou de fournir un identifiant.');
        }

        const roleId = 'ID_DU_ROLE_BLACKLIST'; // Remplacez par l'ID du rôle de blacklist
        const role = message.guild.roles.cache.get(roleId);
        if (!role) {
            return message.reply('Le rôle de blacklist est introuvable.');
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
            const member = await message.guild.members.fetch(userId);
            if (!member) {
                return message.reply('Utilisateur introuvable.');
            }

            await member.roles.add(role);
            const embed = new EmbedBuilder()
                .setTitle('Utilisateur ajouté à la blacklist')
                .setDescription(`${member.user.tag} a été ajouté à la blacklist.`)
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                .setColor('Red');
            message.channel.send({ embeds: [embed] });

            const logChannelId = 'ID_DU_SALON_LOG'; // Remplacez par l'ID du salon de log
            const logChannel = message.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setTitle('Utilisateur blacklisté')
                    .setDescription(`${member.user.tag} a été ajouté à la blacklist par ${message.author.tag}.`)
                    .setColor('Red')
                    .setTimestamp();
                logChannel.send({ embeds: [logEmbed] });
            }

            logger.info(`Utilisateur ${member.user.tag} ajouté à la blacklist par ${message.author.tag}`);
        } catch (err) {
            logger.error('Erreur lors de l\'ajout à la blacklist:', err);
            message.reply('Une erreur est survenue lors de l\'ajout de l\'utilisateur à la blacklist.');
        }
    }
};