const { PermissionsBitField } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'massrole',
    category: 'admin',
    permissions: ['ADMINISTRATOR'],
    ownerOnly: false,
    usage: 'massrole <add|remove> <@role|role_id>',
    examples: ['massrole add @role', 'massrole remove 123456789012345678'],
    description: 'Ajoute ou enlève un rôle à tous les membres du serveur.',
    
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
        }

        if (args.length < 2) {
            return message.reply('Merci de spécifier une action (add/remove) et un rôle.');
        }

        const action = args[0].toLowerCase();
        const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
        if (!role) {
            return message.reply(`Aucun rôle trouvé pour \`${args[1] || " "}\``);
        }

        if (action !== 'add' && action !== 'remove') {
            return message.reply('Action invalide. Utilisez "add" ou "remove".');
        }

        let count = 0;
        const totalMembers = message.guild.memberCount;
        const actionVerb = action === 'add' ? 'ajouté' : 'enlevé';

        message.channel.send(`Je suis en train de ${actionVerb} le rôle \`${role.name}\` à ${totalMembers} utilisateur${totalMembers > 1 ? 's' : ''}...`);

        message.guild.members.cache.forEach(member => {
            setTimeout(async () => {
                try {
                    if (action === 'add') {
                        await member.roles.add(role, `Massrole par ${message.author.tag}`);
                    } else {
                        await member.roles.remove(role, `Massrole par ${message.author.tag}`);
                    }
                    count++;
                    if (count === totalMembers) {
                        message.channel.send(`Le rôle a été ${actionVerb} à ${totalMembers} utilisateur${totalMembers > 1 ? 's' : ''}.`);
                    }
                } catch (error) {
                    console.error(`Erreur lors de la modification des rôles pour ${member.user.tag}:`, error);
                }
            }, 250 * count);
        });
    }
};