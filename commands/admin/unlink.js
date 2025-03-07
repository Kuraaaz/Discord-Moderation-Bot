const { PermissionsBitField } = require('discord.js');
const { bot_logs } = require('../../database/connection');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'unlink',
    category: 'admin',
    permissions: ['SEND_MESSAGES'],
    ownerOnly: false,
    usage: 'unlink <@user>',
    examples: ['unlink @user'],
    description: 'Supprime le rôle spécifié des membres mentionnés et retire les permissions de lien. Seuls les utilisateurs whitelist peuvent exécuter cette commande.',
    
    async execute(message, args) {
        if (!message.mentions.members.size) {
            return message.reply('Merci de mentionner un utilisateur.');
        }

        const roleId = process.env.ROLE_LINK;
        if (!roleId) {
            return message.reply('L\'ID du rôle n\'est pas configuré.');
        }

        // Vérification dans la whitelist
        const [whitelistRows] = await bot_logs.query('SELECT user_id FROM whitelist WHERE user_id = ?', [message.author.id]);
        const isWhitelisted = whitelistRows.length > 0;

        if (!isWhitelisted) {
            return message.reply('Vous n\'êtes pas autorisé à utiliser cette commande.');
        }

        const role = await message.guild.roles.fetch(roleId);
        if (!role) {
            return message.reply('Rôle introuvable.');
        }

        const members = message.mentions.members;

        members.forEach(async member => {
            if (!member.roles.cache.has(role.id)) {
                return message.reply(`${member.user.tag} ne possède pas ce rôle.`);
            }

            try {
                await member.roles.remove(role);
                message.reply(`Le rôle a été retiré de ${member.user.tag}.`);

                // Supprimer l'utilisateur de la table link_perm
                const query = `DELETE FROM link_perm WHERE user_id = ?`;
                await bot_logs.execute(query, [member.user.id]);
            } catch (error) {
                console.error(`Erreur lors du retrait du rôle de ${member.user.tag}:`, error);
                message.reply(`Une erreur est survenue lors du retrait du rôle de ${member.user.tag}.`);
            }
        });
    }
};