const { EmbedBuilder } = require('discord.js');
const logger = require('../../utils/Logger');
const { bot_logs } = require('../../database/connection');

module.exports = {
    name: 'delwl',
    category: 'admin',
    permissions: ['ADMINISTRATOR'],
    ownerOnly: false,
    usage: 'delwl <@user|user_id>',
    examples: ['delwl @user', 'delwl 1046834138583412856'],
    description: 'Supprime un utilisateur de la whitelist en lui retirant un rôle spécifique.',
    
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
            const member = await message.guild.members.fetch(userId);
            if (!member) {
                return message.reply('Utilisateur introuvable.');
            }

            const embed = new EmbedBuilder()
                .setTitle('Utilisateur retiré de la whitelist')
                .setDescription(`${member.user.tag} a été retiré de la whitelist.`)
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                .setColor('Yellow');
            message.channel.send({ embeds: [embed] });

            // Remove the user from the whitelist database
            await bot_logs.query('DELETE FROM whitelist WHERE user_id = ?', [userId]);

            logger.info(`Utilisateur ${member.user.tag} retiré de la whitelist par ${message.author.tag}`);
        } catch (err) {
            logger.error('Erreur lors du retrait de la whitelist:', err);
            message.reply('Une erreur est survenue lors du retrait de l\'utilisateur de la whitelist.');
        }
    }
};