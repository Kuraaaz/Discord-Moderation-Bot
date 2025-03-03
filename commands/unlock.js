const { PermissionsBitField } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'unlock',
    category: 'moderation',
    permissions: ['MANAGE_CHANNELS'],
    ownerOnly: false,
    usage: 'unlock',
    examples: ['unlock'],
    description: 'Permet à everyone d\'écrire sur le salon.',
    
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
        }

        const everyoneRole = message.guild.roles.everyone;

        try {
            await message.channel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: null
            });

            message.reply('Le salon a été déverrouillé. Tout le monde peut maintenant écrire.');
        } catch (error) {
            console.error('Erreur lors du déverrouillage du salon:', error);
            message.reply('Une erreur est survenue lors du déverrouillage du salon.');
        }
    }
};