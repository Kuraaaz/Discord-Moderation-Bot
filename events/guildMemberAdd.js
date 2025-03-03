const { evtDb, bot_logs } = require('../database/connection');
const logger = require('../utils/Logger');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
require('dotenv').config();

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
            // Check if the member is in the blacklist
            const [rows] = await bot_logs.query('SELECT user_id FROM blacklist WHERE user_id = ?', [member.user.id]);
            if (rows.length > 0) {
                await member.kick('Utilisateur blacklisté');
                
                const logChannelId = process.env.LOGS_CHANNEL;
                const logChannel = member.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setTitle('Nouvel utilisateur expulsé (blacklisté)')
                        .setDescription(`${member.user.tag} a été expulsé car il est présent dans la blacklist.`)
                        .setColor('Red')
                        .setTimestamp();
                    logChannel.send({ embeds: [logEmbed] });
                }

                return;
            }

            // Check if the new member is a bot
            if (member.user.bot) {
                const auditLogs = await member.guild.fetchAuditLogs({ type: 28, limit: 1 }); // 28 is the integer value for BOT_ADD
                const auditEntry = auditLogs.entries.first();
                if (auditEntry && auditEntry.target.id === member.user.id) {
                    const { executor } = auditEntry;

                    // Check if the executor is whitelisted
                    const [whitelistRows] = await bot_logs.query('SELECT user_id FROM whitelist WHERE user_id = ?', [executor.id]);
                    const isWhitelisted = whitelistRows.length > 0;

                    if (!isWhitelisted) {
                        // Kick the bot
                        await member.kick('Bot ajouté par un utilisateur non whitelisté');

                        // Remove the executor's admin role
                        const adminRole = member.guild.roles.cache.find(role => role.permissions.has(PermissionsBitField.Flags.Administrator));
                        if (adminRole) {
                            const executorMember = await member.guild.members.fetch(executor.id);
                            await executorMember.roles.remove(adminRole, 'Ajout de bot non autorisé');
                        }

                        const logChannelId = process.env.LOGS_CHANNEL;
                        const logChannel = member.guild.channels.cache.get(logChannelId);
                        if (logChannel) {
                            const logEmbed = new EmbedBuilder()
                                .setTitle('Bot expulsé')
                                .setDescription(`Le bot ${member.user.tag} a été expulsé car il a été ajouté par ${executor.tag} qui n'est pas whitelisté. ${executor.tag} a perdu son rôle administrateur : ${adminRole}.`)
                                .setColor('Red')
                                .setTimestamp();
                            logChannel.send({ embeds: [logEmbed] });
                        }

                        return;
                    }
                }
            }

            const channelId = process.env.WELCOME_CHANNEL;
            const channel = member.guild.channels.cache.get(channelId);

            if (channel) {
                const embed = new EmbedBuilder()
                    .setTitle('Nouveau membre')
                    .setDescription(`${member.user.tag} a rejoint le serveur.`)
                    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
                    .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL() })
                    .setColor('Green');

                channel.send({ embeds: [embed] });
            }

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
