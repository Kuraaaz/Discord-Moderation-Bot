const { PermissionsBitField } = require('discord.js');
const { moderationDb } = require('../database/connection');
const logger = require('../utils/Logger');

module.exports = {
    name: 'clear',
    category: 'moderation',
    permissions: [PermissionsBitField.Flags.ManageMessages],
    ownerOnly: false,
    usage: 'clear <number>',
    examples: ['clear 10'],
    description: 'Clear a specified number of messages from the channel',
    
    async execute(message, args) {
        const amount = parseInt(args[0], 10);

        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply('Vous ne disposez pas de la permission pour supprimer des messages.');
        }

        if (isNaN(amount) || amount <= 0) {
            return message.reply('Merci de spécifier un montant valide de message à supprimer.');
        }

        await message.channel.bulkDelete(amount, true);

        // Modifions la manière dont le message est envoyé après la suppression.
        // Ne faisons pas référence à un message existant, envoyons simplement un message.
        message.channel.send(`${amount} messages ont été supprimés avec succès.`);

        const clearDate = new Date();

        // Store the clear command usage information in the database
        const query = 'INSERT INTO clear_logs (user_id, username, guild_id, guild_name, clear_date, message_count) VALUES (?, ?, ?, ?, ?, ?)';

        try {
            // Utiliser `await` pour exécuter la requête
            await moderationDb.query(query, [message.author.id, message.author.tag, message.guild.id, message.guild.name, clearDate, amount]);
        } catch (err) {
            logger.error('Échec de l\'enregistrement des informations de clear:', err);
        }
    }
};
