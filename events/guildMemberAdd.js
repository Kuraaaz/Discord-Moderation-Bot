const { evtDb } = require('../database/connection');
const logger = require('../utils/Logger');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {

        const channelId = process.env.WELCOME_CHANNEL;
        const channel = member.guild.channels.cache.get(channelId); // ✅ Correct

        if (channel) {
            const embed = new EmbedBuilder()
                .setTitle('Nouveau membre')
                .setDescription(`${member.user.tag} a rejoint le serveur.`)
                .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
                .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() })
                .setColor('Green');

            channel.send({ embeds: [embed] });
    }


        try {
            const joinDate = new Date();
            const query = `INSERT INTO new_members (user_id, username, guild_id, guild_name, join_date) 
                           VALUES (?, ?, ?, ?, ?)`;

            await evtDb.execute(query, [
                member.user.id, 
                member.user.tag, 
                member.guild.id, 
                member.guild.name, 
                joinDate
            ]);


            logger.info(`Nouveau membre ajouté : ${member.user.tag} a rejoint ${member.guild.name}`);
        } catch (err) {
            logger.error(`Erreur lors de l'enregistrement du nouveau membre :`, err);
        }
    }
};
