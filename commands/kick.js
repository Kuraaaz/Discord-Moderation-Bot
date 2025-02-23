const { MessageEmbed, EmbedBuilder } = require('discord.js');
const { moderationDb } = require('../database/connection');
const logger = require('../utils/Logger');

module.exports = {
    name: 'kick',
    category: 'moderation',
    permissions: ['KICK_MEMBERS'],
    ownerOnly: false,
    usage: 'kick <@user>',
    examples: ['kick @user'],
    description: 'Kick a member from the server',
    
    async execute(message, args) {
        if (!message.mentions.members.size) {
            return message.reply('Merci de mentionner un utilisateur à expulser.');
        }

        const member = message.mentions.members.first();
        if (!member.kickable) {
            return message.reply('Je ne peux pas expulser cet utilisateur.');
        }

        await member.kick();
        
        const embed = new EmbedBuilder()
            .setTitle('Utilisateur expulsé')
            .setDescription(`${member} a été expulsé du serveur.`)
            .setAuthor({
                name: message.author.tag,
                iconURL: message.author.displayAvatarURL()
            })
            .setFooter({
                text: message.guild.name,
                iconURL: message.guild.iconURL()
            })
            .setColor('Red'); // Utilisation de "Red"
        message.channel.send({ embeds: [embed] });

        const kickDate = new Date();

        try {
            // Vérification si l'utilisateur existe déjà dans la base de données
            const [results] = await moderationDb.query('SELECT * FROM kicks WHERE user_id = ?', [member.id]);

            if (results.length > 0) {
                // Si l'utilisateur existe, on met à jour le nombre de kicks et la date
                await moderationDb.query(
                    'UPDATE kicks SET kick_date = ?, kick_count = kick_count + 1, guild_id = ?, guild_name = ?, executor_id = ?, executor_name = ? WHERE user_id = ?',
                    [kickDate, message.guild.id, message.guild.name, message.author.id, message.author.tag, member.id]
                );
            } else {
                // Sinon, on insère une nouvelle ligne pour l'utilisateur
                await moderationDb.query(
                    'INSERT INTO kicks (user_id, username, kick_date, kick_count, guild_id, guild_name, executor_id, executor_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [member.id, member.user.tag, kickDate, 1, message.guild.id, message.guild.name, message.author.id, message.author.tag]
                );
            }
        } catch (err) {
            logger.error('Erreur dans l\'accès à la base de données ou lors du traitement des kicks:', err);
        }
    }
};
