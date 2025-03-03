const fs = require('fs');
const path = require('path');
const logger = require('../utils/Logger');
const events = new Map();

function loadEvents(dirPath) {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(dirPath, file.name);

        if (file.isDirectory()) {
            loadEvents(fullPath);
        } else if (file.name.endsWith('.js')) {
            try {
                const event = require(fullPath);
                if (event.name && typeof event.execute === 'function') {
                    events.set(event.name, event);
                    logger.event(`Événement chargé: ${event.name}`);
                } else {
                    logger.warn(`Le fichier ${file.name} n'a pas une structure valide.`);
                }
            } catch (error) {
                console.log(`Erreur lors du chargement de ${file.name}:`, error);
            }
        }
    }
}

function setupEvents(client) {
    events.forEach((event, eventName) => {
        client.on(eventName, (...args) => {
            try {
                event.execute(...args);
            } catch (error) {
                console.log(`Erreur lors de l'exécution de l'événement ${eventName}:`, error);
            }
        });
    });
}

module.exports = { setupEvents, loadEvents };
