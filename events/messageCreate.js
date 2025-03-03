const logger = require('../utils/Logger');
const commandHandler = require('../Handler/command');
const { bot_logs } = require('../database/connection');
require('dotenv').config();

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        // Check if the message contains a link
        const linkRegex = /(https?:\/\/[^\s]+)/g;
        if (linkRegex.test(message.content)) {
            // Check if the author is whitelisted
            const [whitelistRows] = await bot_logs.query('SELECT user_id FROM whitelist WHERE user_id = ?', [message.author.id]);
            const isWhitelisted = whitelistRows.length > 0;

            // Check if the author is in the link_perm table
            const [linkPermRows] = await bot_logs.query('SELECT user_id FROM link_perm WHERE user_id = ?', [message.author.id]);
            const hasLinkPerm = linkPermRows.length > 0;

            if (!isWhitelisted && !hasLinkPerm) {
                // Delete the message
                await message.delete();
                logger.info(`Message contenant un lien supprimé de ${message.author.tag} dans ${message.guild.name}`);
                return;
            }
        }

        if (!message.content.startsWith(process.env.PREFIX)) return;
        commandHandler.executeCommand(message, process.env.PREFIX);
        logger.info(`${this.execute.name} executed in ${message.guild.name} by ${message.author.tag}`);
    }
};