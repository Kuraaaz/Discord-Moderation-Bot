const { PermissionsBitField } = require('discord.js');
const { bot_logs } = require('../../database/connection');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'link',
    category: 'admin',
    permissions: ['SEND_MESSAGES'],
    ownerOnly: false,
    usage: 'link <@user>',
    examples: ['link @user'],
    description: 'Ajoute le rôle spécifié aux membres mentionnés. Seuls les utilisateurs whitelist peuvent exécuter cette commande.',
    
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
            if (member.roles.cache.has(role.id)) {
                return message.reply(`${member.user.tag} possède déjà ce rôle.`);
            }

            try {
                await member.roles.add(role);
                message.reply(`Le rôle a été ajouté à ${member.user.tag}.`);

                // Ajouter l'utilisateur dans la table link_perm
                const query = `INSERT INTO link_perm (user_id, added_by) VALUES (?, ?)`;
                await bot_logs.execute(query, [member.user.id, message.author.id]);
            } catch (error) {
                console.error(`Erreur lors de l'ajout du rôle à ${member.user.tag}:`, error);
                message.reply(`Une erreur est survenue lors de l'ajout du rôle à ${member.user.tag}.`);
            }
        });
    }
};