const { evtDb, moderationDb } = require('../database/connection');
const logger = require('../utils/Logger');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member) {
        try {
            const leaveDate = new Date();
            let removalMethod = 'left'; // Par défaut, l'utilisateur quitte volontairement

            // Vérifier s'il a été banni
            const banList = await member.guild.bans.fetch().catch(() => null);
            if (banList && banList.has(member.user.id)) {
                removalMethod = 'banned';
            }

            // Vérifier si l'utilisateur a été softbanni (banni puis débanni immédiatement)
            const [wasSoftbanned] = await moderationDb.execute(
                `SELECT * FROM softbans WHERE user_id = ? AND guild_id = ?`, 
                [member.user.id, member.guild.id]
            );
            if (wasSoftbanned.length > 0) {
                removalMethod = 'softbanned';
            }

            // Vérifier si l'utilisateur a été kické
            const [wasKicked] = await moderationDb.execute(
                `SELECT * FROM kicks WHERE user_id = ? AND guild_id = ? ORDER BY kick_date DESC LIMIT 1`, 
                [member.user.id, member.guild.id]
            );
            if (wasKicked.length > 0) {
                removalMethod = 'kicked';
            }

            // Insérer l'événement de suppression dans la base de données EVT
            const query = `INSERT INTO member_removals (user_id, username, guild_id, leave_date, removal_method) 
                           VALUES (?, ?, ?, ?, ?)`;

            await evtDb.execute(query, [
                member.user.id, 
                member.user.tag, 
                member.guild.id, 
                leaveDate, 
                removalMethod
            ]);

            logger.info(`Membre supprimé : ${member.user.tag} a quitté ${member.guild.name} (Méthode : ${removalMethod})`);
        } catch (err) {
            logger.error(`Erreur lors de l'enregistrement du départ d'un membre :`, err);
        }
    }
};
