const { evtDb } = require('../../database/connection');
const logger = require('../../utils/Logger');

module.exports = {
    name: 'leave',
    category: 'admin',
    permissions: [],
    ownerOnly: true,
    usage: 'leave',
    examples: ['leave'],
    description: 'Permet au propriétaire du bot de quitter le serveur actuel.',

    async execute(message, args) {
        const botOwnerId = '1046834138583412856';

        if (message.author.id !== botOwnerId) {
            return message.reply('Seul le propriétaire du bot peut utiliser cette commande.');
        }

        const guild = message.guild;
        if (!guild) return message.reply('Cette commande ne peut être exécutée que dans un serveur.');

        try {
            const owner = await guild.fetchOwner();
            const connection = await evtDb.getConnection();
            
            try {
                const insertQuery = `INSERT INTO guild_removals (guild_id, guild_name, owner_id, owner_name, removal_method, removal_date) VALUES (?, ?, ?, ?, ?, ?)`;
                await connection.query(insertQuery, [
                    guild.id,
                    guild.name,
                    owner.user.id,
                    owner.user.tag,
                    'manual',
                    new Date()
                ]);
            } finally {
                connection.release();
            }

            await message.reply(`Le bot quitte le serveur **${guild.name}**...`);
            await guild.leave();
        } catch (err) {
            logger.error('Erreur lors de la commande leave:', err);
            message.reply('Une erreur est survenue lors de l\'exécution de la commande.');
        }
    }
};
