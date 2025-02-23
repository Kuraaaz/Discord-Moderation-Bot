const mysql = require('mysql2/promise'); // Importer la version promise directement
const logger = require('../utils/Logger.js');

// Connexion pour la base de données MODERATION
const moderationDb = mysql.createPool({
  host: process.env.DB_HOST_MOD,
  user: process.env.DB_USER_MOD,
  password: process.env.DB_PASSWORD_MOD,
  database: process.env.DB_NAME_MOD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Connexion pour la base de données EVT
const evtDb = mysql.createPool({
  host: process.env.DB_HOST_EVT,
  user: process.env.DB_USER_EVT,
  password: process.env.DB_PASSWORD_EVT,
  database: process.env.DB_NAME_EVT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Connexion pour la base de données LOG
const bot_logs = mysql.createPool({
  host: process.env.DB_HOST_LOG,
  user: process.env.DB_USER_LOG,
  password: process.env.DB_PASSWORD_LOG,
  database: process.env.DB_NAME_LOG,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


// Test de la connexion à chaque base de données (optionnel)
const testConnection = async (name, pool) => {
  try {
    const connection = await pool.getConnection();
    logger.info(`Connecté à la base de données ${name}`);
    connection.release();
  } catch (err) {
    logger.error(`Erreur de connexion à ${name}: ${err.message}`);
  }
};

testConnection('MODERATION', moderationDb);
testConnection('EVT', evtDb);
testConnection('LOG', bot_logs);

// Exporter les connexions pour une utilisation ailleurs
module.exports = {
  moderationDb,
  evtDb,
  bot_logs,
};
