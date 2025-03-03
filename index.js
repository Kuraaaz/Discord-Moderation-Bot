const mysql = require('mysql2'); 
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const commandHandler = require('./Handler/command');
const eventHandler = require('./Handler/event');
const logger = require('./utils/Logger');
const { loadEvents, setupEvents } = require('./Handler/event');
const path = require('path');


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ]
});

eventHandler.setupEvents(client);


client.login(process.env.TOKEN).then(() => {
    loadEvents(path.join(__dirname, 'events'));
    setupEvents(client);
    
  });
  