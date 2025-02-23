const { bot_logs, moderationDb } = require('../database/connection');
const logger = require('../utils/Logger');
const { loadEvents, setupEvents } = require('../Handler/event');
const path = require('path');

/**
 * Fonction utilitaire pour enregistrer une action dans la base de données.
 * @param {string} type - Le type d'action (ex: 'connection', 'messageCreate', 'command', etc.).
 * @param {string} content - Le contenu ou la description de l'action.
 * @param {string|null} guildId - L'identifiant du serveur (si applicable).
 * @param {string|null} guildName - Le nom du serveur (si applicable).
 * @param {string|null} channelId - L'identifiant du salon (si applicable).
 * @param {string|null} channelName - Le nom du salon (si applicable).
 * @param {string|null} userId - L'identifiant de l'utilisateur (si applicable).
 * @param {string|null} username - Le tag ou le nom de l'utilisateur (si applicable).
 */
async function logToDatabase(
  type,
  content,
  guildId = null,
  guildName = null,
  channelId = null,
  channelName = null,
  userId = null,
  username = null
) {
  const query = `
    INSERT INTO logs 
      (type, content, guild_id, guild_name, channel_id, channel_name, user_id, username, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  try {
    await bot_logs.query(query, [
      type,
      content,
      guildId,
      guildName,
      channelId,
      channelName,
      userId,
      username,
      new Date(),
    ]);
    logger.info(`Action '${type}' enregistrée dans la DB.`);
  } catch (err) {
    logger.error(`Échec de la journalisation de l'action '${type}':`, err);
  }
}

module.exports = {
  name: 'ready',
  async execute(client) {
    // Connexion du bot
    logger.client(`Connecté en tant que ${client.user.tag} !`);
    await logToDatabase('connection', `Bot connecté en tant que ${client.user.tag}`);

    // Gestion de l'activité (statuts)
    const statuses = [
      "Modère Murosami",
      ".gg/murosami",
      "Made by Kura",
      "Murosami Bot",
      "Welcome in Murosami !"
    ];
    let index = 0;
    setInterval(() => {
      client.user.setActivity(statuses[index]);
      index = (index + 1) % statuses.length;
    }, 10000); // Change toutes les 10 secondes

    // Enregistrement de l'événement de démarrage dans une autre table par exemple
    const startupTime = new Date();
    const startupQuery = 'INSERT INTO startups (startup_time) VALUES (?)';
    try {
      await bot_logs.query(startupQuery, [startupTime]);
      logger.info('Événement de démarrage enregistré.');
      await logToDatabase('startup', `Démarrage du bot à ${startupTime}`);
    } catch (err) {
      logger.error('Impossible d\'enregistrer l\'événement de démarrage:', err);
    }

    // Anti-raid et journalisation de chaque message reçu
    const messageCounts = new Map();
    client.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      // Anti-spam simple
      const userId = message.author.id;
      const now = Date.now();
      if (!messageCounts.has(userId)) {
        messageCounts.set(userId, []);
      }
      const timestamps = messageCounts.get(userId);
      timestamps.push(now);
      const filteredTimestamps = timestamps.filter(ts => now - ts < 2000);
      messageCounts.set(userId, filteredTimestamps);
      if (filteredTimestamps.length > 5) {
        try {
          await message.member.timeout(60000); // Timeout de 60 secondes
          message.channel.send(`${message.author.tag} a été mis en timeout pour spam.`);
          await logToDatabase(
            'anti-raid',
            `${message.author.tag} timeout pour spam`,
            message.guild.id,
            message.guild.name,
            message.channel.id,
            message.channel.name,
            message.author.id,
            message.author.tag
          );
        } catch (err) {
          logger.error(err);
        }
      }

      // Journalisation de l'événement messageCreate
      await logToDatabase(
        'messageCreate',
        message.content,
        message.guild.id,
        message.guild.name,
        message.channel.id,
        message.channel.name,
        message.author.id,
        message.author.tag
      );
    });

    // Journalisation des erreurs du client
    client.on('error', async (error) => {
      await logToDatabase('error', error.message);
    });

    // Journalisation de toutes les commandes exécutées
    client.on('interactionCreate', async (interaction) => {
        if (!interaction.isCommand()) return;
        await logToDatabase(
          'command',
          `Commande exécutée: ${interaction.commandName}`,
          interaction.guildId,
          interaction.guild?.name,
          interaction.channelId,
          interaction.channel?.name,
          interaction.user.id,
          interaction.user.tag
        );
      });
  
      // Journalisation de tous les événements
      const { Events, Activity } = require('discord.js');
      const eventsToLog = Object.values(Events);

  
      for (const event of eventsToLog) {
        client.on(event, async (...args) => {
          await logToDatabase(event, JSON.stringify(args));
        });
      }
  
      // Journalisation des erreurs
      client.on('error', async (error) => {
        await logToDatabase('error', error.message);
      });
  }
};
