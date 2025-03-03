const { EmbedBuilder } = require('discord.js');
const logger = require('../../utils/Logger');

module.exports = {
    name: 'addwl',
    category: 'admin',
    permissions: ['MANAGE_ROLES'],
    ownerOnly: false,
    usage: 'addwl <@user|user_id>',
    examples: ['addwl @user', 'addwl 1046834138583412856'],
    description: 'Ajoute un utilisateur à la whitelist en lui conférant un rôle spécifique.',
    
    async execute(message, args) {
        if (!args.length) {
            return message.reply('Merci de mentionner un utilisateur ou de fournir un identifiant.');
        }

        const roleId = 'ID_DU_ROLE_WHITELIST'; 
        const role = message.guild.roles.cache.get(roleId);
        if (!role) {
            return message.reply('Le rôle de whitelist est introuvable.');
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
                .setTitle('Utilisateur ajouté à la whitelist')
                .setDescription(`${member.user.tag} a été ajouté à la whitelist.`)
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                .setColor('Green');
            message.channel.send({ embeds: [embed] });

            logger.info(`Utilisateur ${member.user.tag} ajouté à la whitelist par ${message.author.tag}`);
        } catch (err) {
            logger.error('Erreur lors de l\'ajout à la whitelist:', err);
            message.reply('Une erreur est survenue lors de l\'ajout de l\'utilisateur à la whitelist.');
        }
    }
};