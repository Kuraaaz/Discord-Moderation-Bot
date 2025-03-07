const { PermissionsBitField } = require('discord.js');
const { moderationDb } = require('../database/connection');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'warn',
    category: 'moderation',
    permissions: [PermissionsBitField.Flags.KickMembers],
    ownerOnly: false,
    usage: 'warn <@user> <reason>',
    examples: ['warn @user Spamming'],
    description: 'Avertit un utilisateur et stocke l\'avertissement dans la base de données.',
    
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
            return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
        }

        const member = message.mentions.members.first();
        if (!member) {
            return message.reply('Merci de mentionner un utilisateur à avertir.');
        }

        const reason = args.slice(1).join(' ');
        if (!reason) {
            return message.reply('Merci de fournir une raison pour l\'avertissement.');
        }

        try {
            // Get the current warn count for the user
            const [rows] = await moderationDb.execute('SELECT COUNT(*) as warnCount FROM warn WHERE user_id = ?', [member.user.id]);
            const warnCount = rows[0].warnCount;

            // Insert the new warn with the incremented warn_id
            const query = `INSERT INTO warn (user_id, username, reason, warned_by_id, warned_by_username, warn_id) 
                           VALUES (?, ?, ?, ?, ?, ?)`;
            await moderationDb.execute(query, [
                member.user.id,
                member.user.tag,
                reason,
                message.author.id,
                message.author.tag,
                warnCount + 1
            ]);

            message.reply(`L'utilisateur ${member.user.tag} a été averti pour la raison suivante: ${reason}`);
        } catch (error) {
            console.error('Erreur lors de l\'enregistrement de l\'avertissement:', error);
            message.reply('Une erreur est survenue lors de l\'enregistrement de l\'avertissement.');
        }
    }
};