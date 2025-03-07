const fs = require('fs');
const path = require('path');
const logger = require('../utils/Logger');

const commands = new Map();

// Fonction pour charger les commandes de manière récursive
function loadCommands(dirPath) {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dirPath, file.name);

        if (file.isDirectory()) {
            // Si c'est un dossier, on l'explore récursivement
            loadCommands(fullPath);
        } else if (file.name.endsWith('.js')) {
            try {
                const command = require(fullPath);
                if (command.name && typeof command.execute === 'function') {
                    commands.set(command.name.toLowerCase(), command);
                    logger.command(`Commande chargée: ${command.name}`);
                } else {
                    logger.warn(`Le fichier ${file.name} n'a pas de propriété "name" ou "execute" valide.`);
                }
            } catch (error) {
                console.log(`Erreur lors du chargement de ${file.name}:`, error);
            }
        }
    }
}

// Chargement initial des commandes
loadCommands(path.join(__dirname, '../commands'));

module.exports = {
    // Exécuter la commande si elle existe
    executeCommand: (message, prefix) => {
        if (!prefix || typeof prefix !== 'string') {
            console.error("Le préfixe est invalide ou non défini !");
            return;
        }

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();

        // Vérifie si la commande existe
        if (!commandName || !commands.has(commandName)) {
            message.reply("Commande inconnue. Utilisez `help` pour voir les commandes disponibles.");
            return;
        }

        const command = commands.get(commandName);

        // Vérifie si la commande a les permissions nécessaires
        if (command.permissions && !message.member.permissions.has(command.permissions)) {
            return message.reply("Vous n'avez pas les permissions nécessaires pour exécuter cette commande.");
        }

        try {
            command.execute(message, args);
        } catch (error) {
            console.error("Erreur lors de l'exécution de la commande :", error);
            message.reply('Une erreur est survenue lors de l\'exécution de cette commande !');
        }
    },

    // Retourne toutes les commandes
    getCommands: () => {
        return Array.from(commands.values());
    }
};
