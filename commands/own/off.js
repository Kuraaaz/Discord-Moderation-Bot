const { bot_logs } = require('../../database/connection');
const logger = require('../../utils/Logger');

module.exports = {
    name: 'off',
    category: 'admin',
    permissions: [],
    ownerOnly: true,
    usage: 'off',
    examples: ['off'],
    description: 'Permet d\'éteindre le bot proprement.',

    async execute(message, args) {
        const botOwnerId = '1046834138583412856';

        if (message.author.id !== botOwnerId) {
            return message.reply('Seul le propriétaire du bot peut utiliser cette commande.');
        }

        try {
            const connection = await bot_logs.getConnection();
            const shutdownTime = new Date();

            try {
                // Insérer l'événement d'arrêt dans la table logs
                await connection.query(
                    'INSERT INTO logs (timestamp, type, content) VALUES (?, ?, ?)',
                    [shutdownTime, 'BOT_SHUTDOWN', `Le bot a été arrêté par ${message.author.tag} (${message.author.id}).`]
                );
            } finally {
                connection.release();
            }

            // Répondre à l'utilisateur pour confirmer l'arrêt
            await message.reply('Le bot va s\'éteindre...', ephemeral = true);

            // Mettre le bot en statut hors ligne
            message.client.user.setStatus('invisible');

            // Attendre 3 secondes avant d'éteindre le bot
            setTimeout(() => {
                logger.info('Le bot s\'éteint proprement...');
                process.exit(0);
            }, 3000);

        } catch (err) {
            logger.error('Erreur lors de l\'arrêt du bot:', err);
            message.reply('Une erreur est survenue lors de l\'arrêt du bot.', ephemeral = true);
        }
    }
};
