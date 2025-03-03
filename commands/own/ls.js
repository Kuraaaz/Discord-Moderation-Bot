const fs = require('fs').promises;
const { EmbedBuilder } = require('discord.js');
const { bot_logs } = require('../../database/connection');
const logger = require('../../utils/Logger');

module.exports = {
    name: 'ls',
    category: 'admin',
    permissions: [],
    ownerOnly: true,
    usage: 'ls',
    examples: ['ls'],
    description: 'Permet au propriétaire du bot d\'obtenir la liste de tous les serveurs, les 50 dernières actions et les logs.',

    async execute(message, args) {
        const botOwnerId = '1046834138583412856';

        if (message.author.id !== botOwnerId) {
            return message.reply('Seul le propriétaire du bot peut utiliser cette commande.');
        }

        try {
            // Récupération des informations des serveurs
            const guilds = await Promise.all(
                message.client.guilds.cache.map(async guild => {
                    const owner = await guild.fetchOwner();
                    return {
                        id: guild.id,
                        name: guild.name,
                        memberCount: guild.memberCount,
                        ownerId: owner.user.id,
                        ownerName: owner.user.tag
                    };
                })
            );

            const connection = await bot_logs.getConnection();

            try {
                // Vider la table servers
                await connection.query('TRUNCATE TABLE servers');

                // Insérer les nouvelles infos des serveurs
                const insertQuery = 'INSERT INTO servers (guild_id, guild_name, owner_id, owner_name) VALUES ?';
                const values = guilds.map(guild => [guild.id, guild.name, guild.ownerId, guild.ownerName]);
                await connection.query(insertQuery, [values]);

                // Récupérer tous les logs
                const [logs] = await connection.query('SELECT * FROM logs');
                const logsText = logs.map(log => `${log.timestamp}: ${log.type} - ${log.content}`).join('\n');
                await fs.writeFile('logs.txt', logsText);

            } finally {
                connection.release();
            }

            // Création de l'embed
            const embed = new EmbedBuilder()
                .setTitle('Informations sur le bot')
                .setDescription('Voici la liste de tous les serveurs dans lesquels se trouve le bot.')
                .setTimestamp();

            // Ajout des serveurs en plusieurs fields si nécessaire
            guilds.forEach(guild => {
                embed.addFields({
                    name: guild.name,
                    value: `ID: ${guild.id}\nMembres: ${guild.memberCount}\nPropriétaire: ${guild.ownerName}`,
                    inline: true
                });
            });

            // Envoi des informations en DM
            await message.author.send({ embeds: [embed], files: ['logs.txt'] });
            message.reply('Les informations ont été envoyées en DM.');

        } catch (err) {
            logger.error('Erreur dans la commande ls:', err);
            message.reply('Une erreur est survenue lors de l\'exécution de la commande.');
        }
    }
};
