const { evtDb } = require('../database/connection'); 
const logger = require('../utils/Logger');

module.exports = {
    name: 'guildCreate',
    async execute(guild) { // Ajout de async pour gérer les promesses
        logger.info(`Joined a new guild: ${guild.name}`);

        try {
            const joinDate = new Date();
            const owner = await guild.fetchOwner(); // Attendre la récupération du propriétaire
            
            const query = 'INSERT INTO guilds_join (guild_id, guild_name, owner_id, owner_name, join_date) VALUES (?, ?, ?, ?, ?)';
            await evtDb.execute(query, [guild.id, guild.name, owner.user.id, owner.user.tag, joinDate]); // Utiliser execute

            logger.info(`Guild ${guild.name} enregistrée avec succès.`);
        } catch (err) {
            console.log('Erreur lors de l\'enregistrement du serveur:', err);
        }
    }
};
