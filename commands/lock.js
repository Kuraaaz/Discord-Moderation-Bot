const { PermissionsBitField } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'lock',
    category: 'moderation',
    permissions: [PermissionsBitField.Flags.ManageChannels],
    ownerOnly: false,
    usage: 'lock',
    examples: ['lock'],
    description: 'Empêche à everyone d\'écrire sur le salon.',
    
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
        }

        const everyoneRole = message.guild.roles.everyone;

        try {
            await message.channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: false
            });

            message.reply('Le salon a été verrouillé.');
        } catch (error) {
            console.error('Erreur lors du verrouillage du salon:', error);
            message.reply('Une erreur est survenue lors du verrouillage du salon.');
        }
    }
};