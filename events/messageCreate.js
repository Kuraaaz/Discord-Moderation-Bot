const logger = require('../utils/Logger');
const commandHandler = require('../Handler/command');
require('dotenv').config();


module.exports = {
    name: 'messageCreate',
    execute(message) {
        if (message.author.bot) return;
        if (!message.content.startsWith(process.env.PREFIX) || message.author.bot) return;
        commandHandler.executeCommand(message, process.env.PREFIX);
        logger.info(`${this.execute.name} executed in ${message.guild.name} by ${message.author.tag}`);
    }
};