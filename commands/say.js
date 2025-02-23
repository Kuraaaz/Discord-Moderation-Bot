const { moderationDb } = require('../database/connection');
const logger = require('../utils/Logger');

module.exports = {
    name: 'say',
    category: 'utility',
    permissions: ['MANAGE_MESSAGES'],
    ownerOnly: false,
    usage: 'say <message>',
    examples: ['say il fait beau aujourd\'hui'],
    description: 'Le bot envoie un message avec le contenu spécifié et supprime le message de l\'utilisateur.',
    
    async execute(message, args) {
        const sayMessage = args.join(' ');
        if (!sayMessage) {
            return message.reply('Merci de spécifier un message à envoyer.');
        }

        await message.delete();

        const sentMessage = await message.channel.send(sayMessage);

        const sayDate = new Date();

        try {
            // Enregistrement des informations de la commande "say" dans la base de données
            const query = 'INSERT INTO say_logs (message_content, guild_id, guild_name, channel_id, channel_name, executor_id, executor_name, say_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            await moderationDb.query(query, [sayMessage, message.guild.id, message.guild.name, message.channel.id, message.channel.name, message.author.id, message.author.tag, sayDate]);
        } catch (err) {
            logger.error('Échec de l\'enregistrement des informations de say:', err);
        }
    }
};
