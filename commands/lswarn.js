const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const { moderationDb } = require('../database/connection');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'lswarn',
    category: 'moderation',
    permissions: [PermissionsBitField.Flags.KickMembers],
    ownerOnly: false,
    usage: 'lswarn <@user|user_id>',
    examples: ['lswarn @user', 'lswarn 123456789012345678'],
    description: 'Affiche la liste de tous les avertissements d\'un utilisateur mentionné ou avec son identifiant.',
    
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
        }

        const member = message.mentions.members.first();
        const userId = member ? member.user.id : args[0];

        if (!userId) {
            return message.reply('Merci de mentionner un utilisateur ou de fournir un identifiant d\'utilisateur.');
        }

        try {
            // Get the list of warnings for the user
            const [rows] = await moderationDb.execute('SELECT * FROM warn WHERE user_id = ?', [userId]);

            if (rows.length === 0) {
                return message.reply('Aucun avertissement trouvé pour cet utilisateur.');
            }

            const embed = new EmbedBuilder()
                .setTitle('Liste des avertissements')
                .setColor('#FFA500')
                .setTimestamp();

            rows.forEach(row => {
                embed.addFields({ name: `Warn ID: ${row.warn_id}`, value: `Raison: ${row.reason}\nAverti par: ${row.warned_by_username}\nDate: ${new Date(row.warned_at).toLocaleDateString()}`, inline: false });
            });

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Erreur lors de la récupération des avertissements:', error);
            message.reply('Une erreur est survenue lors de la récupération des avertissements.');
        }
    }
};