const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'help',
    category: 'utility',
    permissions: [PermissionsBitField.Flags.SendMessages],
    ownerOnly: false,
    usage: 'help',
    examples: ['help'],
    description: 'Affiche la liste de toutes les commandes disponibles.',
    
    async execute(message, args) {

        if (!message.member.permissions.has(PermissionsBitField.Flags.SendMessages)) {
            return message.reply('Vous n\'avez pas la permission d\'envoyer des messages.');
        }

        try {
            // Charger les commandes depuis le dossier 'commands'
            const commandFiles = fs.readdirSync(path.join(__dirname, '..', 'commands'))
                .filter(file => file.endsWith('.js'));

            const publicCommands = [];

            // Lire les fichiers de commandes et filtrer celles qui ne sont pas réservées à l'owner
            for (const file of commandFiles) {
                const command = require(path.join(__dirname, '..', 'commands', file));
                if (!command.ownerOnly) {
                    publicCommands.push(command);
                }
            }

            // Vérifier si des commandes publiques ont été trouvées
            if (publicCommands.length === 0) {
                return message.reply('Aucune commande publique n\'a été trouvée.');
            }

            // Créer l'embed
            const embed = new EmbedBuilder()
                .setTitle('Liste des commandes')
                .setDescription('Voici la liste de toutes les commandes disponibles:')
                .setColor('Blue')
                .setTimestamp();

            // Ajouter les commandes à l'embed
            publicCommands.forEach(command => {
                embed.addFields(
                    { name: `**${command.name}**`, value: `Description: ${command.description}\nUsage: \`${command.usage}\`\nExemples: ${command.examples.length > 0 ? command.examples.join(', ') : 'Aucun exemple disponible'}` }
                );
            });

            // Envoyer l'embed
            message.channel.send({ embeds: [embed] });
        } catch (err) {
            console.error('Erreur lors de l\'exécution de la commande help:', err);
            message.reply('Une erreur est survenue lors de l\'exécution de la commande.');
        }
    }
};
