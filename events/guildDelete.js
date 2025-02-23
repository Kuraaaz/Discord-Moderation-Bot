const { evtDb } = require('../database/connection'); 
const logger = require('../utils/Logger');

module.exports = {
    name: 'guildDelete',
    async execute(guild) { // Ajout de async pour gérer les promesses
        logger.info(`Removed from a guild: ${guild.name}`);

        try {
            const removalDate = new Date();
            const owner = await guild.fetchOwner(); // Attendre la récupération du propriétaire
            
            const query = 'INSERT INTO guild_removals (guild_id, guild_name, owner_id, owner_name, removal_method, removal_date) VALUES (?, ?, ?, ?, ?, ?)';
            await evtDb.execute(query, [guild.id, guild.name, owner.user.id, owner.user.tag, 'removed', removalDate]); // Utilisation de execute()

            logger.info(`Guild ${guild.name} supprimée et enregistrée avec succès.`);
        } catch (err) {
            console.log('Erreur lors de l\'enregistrement du serveur supprimé:', err);
        }
    }
};
