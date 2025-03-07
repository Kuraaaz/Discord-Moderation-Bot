const { PermissionsBitField } = require('discord.js');
const { moderationDb } = require('../database/connection');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'unwarn',
    category: 'moderation',
    permissions: [PermissionsBitField.Flags.KickMembers],
    ownerOnly: false,
    usage: 'unwarn <@user> [warning_id]',
    examples: ['unwarn @user 1', 'unwarn @user'],
    description: 'Supprime les avertissements d\'un utilisateur mentionné. Peut spécifier un ID d\'avertissement ou supprimer tous les avertissements.',
    
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
        }

        const member = message.mentions.members.first();
        if (!member) {
            return message.reply('Merci de mentionner un utilisateur dont vous souhaitez supprimer les avertissements.');
        }

        const warningId = args[1];

        try {
            if (warningId) {
                // Supprimer un avertissement spécifique
                const query = `DELETE FROM warn WHERE warn_id = ? AND user_id = ?`;
                const [result] = await moderationDb.execute(query, [warningId, member.user.id]);

                if (result.affectedRows === 0) {
                    return message.reply(`Aucun avertissement trouvé avec l'ID ${warningId} pour l'utilisateur ${member.user.tag}.`);
                }

                message.reply(`L'avertissement avec l'ID ${warningId} pour l'utilisateur ${member.user.tag} a été supprimé.`);
            } else {
                // Supprimer tous les avertissements de l'utilisateur
                const query = `DELETE FROM warn WHERE user_id = ?`;
                const [result] = await moderationDb.execute(query, [member.user.id]);

                if (result.affectedRows === 0) {
                    return message.reply(`Aucun avertissement trouvé pour l'utilisateur ${member.user.tag}.`);
                }

                message.reply(`Tous les avertissements pour l'utilisateur ${member.user.tag} ont été supprimés.`);
            }
        } catch (error) {
            console.error('Erreur lors de la suppression des avertissements:', error);
            message.reply('Une erreur est survenue lors de la suppression des avertissements.');
        }
    }
};