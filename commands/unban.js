const { EmbedBuilder } = require('discord.js');
const { moderationDb } = require('../database/connection');
const logger = require('../utils/Logger');

module.exports = {
    name: 'unban',
    category: 'moderation',
    permissions: ['BAN_MEMBERS'],
    ownerOnly: false,
    usage: 'unban <@user|user_id>',
    examples: ['unban @user', 'unban 1046834138583412856'],
    description: 'Débanni un utilisateur du serveur et supprime ses données des tables "bans" et "softbans".',
    
    async execute(message, args) {
        // Vérifier que l'argument est fourni (mention ou identifiant)
        if (!args.length) {
            return message.reply('Merci de fournir la mention ou l\'ID d\'un utilisateur à débannir.');
        }
        
        // Extraction de l'ID depuis une mention ou directement l'argument numérique
        const mentionRegex = /^<@!?(\d+)>$/;
        let userId;
        if (mentionRegex.test(args[0])) {
            userId = args[0].match(mentionRegex)[1];
        } else if (/^\d+$/.test(args[0])) {
            userId = args[0];
        } else {
            return message.reply('Merci de fournir une mention valide ou un identifiant numérique.');
        }
        
        try {
            const connection = await moderationDb.getConnection();

            // Vérification dans la table bans
            const selectBanQuery = 'SELECT * FROM bans WHERE user_id = ? AND guild_id = ?';
            const [banResults] = await connection.query(selectBanQuery, [userId, message.guild.id]);

            // Vérification dans la table softbans
            const selectSoftbanQuery = 'SELECT * FROM softbans WHERE user_id = ? AND guild_id = ?';
            const [softbanResults] = await connection.query(selectSoftbanQuery, [userId, message.guild.id]);

            // Si l'utilisateur n'est dans aucune des deux tables, il n'est pas banni
            if (banResults.length === 0 && softbanResults.length === 0) {
                connection.release();
                return message.reply('Cet utilisateur n\'est pas banni et ne peut pas être débanni.');
            }

            // Tente de débannir l'utilisateur
            let user;
            try {
                user = await message.guild.members.unban(userId);
            } catch (err) {
                connection.release();
                console.log(`Erreur lors du débannissement: ${err.message}`);
                return message.reply('Cet utilisateur n\'est pas banni et ne peut pas être débanni.');
            }

            // Optionnel : logguer l'objet user pour débogage
            logger.info('Utilisateur débanni:', user);

            // Ici, on ne vérifie plus strictement user.id car parfois l'objet retourné peut différer.
            const embed = new EmbedBuilder()
                .setTitle('Utilisateur débanni')
                .setDescription(`${user.tag} a été débanni du serveur.`)
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                .setColor('Green');
            message.channel.send({ embeds: [embed] });

            // Suppression des informations de l'utilisateur dans la table bans
            const deleteBanQuery = 'DELETE FROM bans WHERE user_id = ? AND guild_id = ?';
            await connection.query(deleteBanQuery, [userId, message.guild.id]);

            // Suppression des informations de l'utilisateur dans la table softbans
            const deleteSoftbanQuery = 'DELETE FROM softbans WHERE user_id = ? AND guild_id = ?';
            await connection.query(deleteSoftbanQuery, [userId, message.guild.id]);

            logger.info(`Les informations de ban et de softban pour ${user.tag || userId} ont été supprimées de la base de données.`);
            connection.release();
        } catch (err) {
            console.log('Erreur avec la connexion MySQL:', err);
            return message.reply('Une erreur est survenue avec la base de données.');
        }
    }
};