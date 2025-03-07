const { PermissionsBitField } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    name: 'renew',
    category: 'moderation',
    permissions: [PermissionsBitField.Flags.ManageChannels],
    ownerOnly: false,
    usage: 'renew',
    examples: ['renew'],
    description: 'Supprime un salon et le recrée avec les mêmes permissions et la même place.',
    
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply('Vous n\'avez pas la permission d\'utiliser cette commande.');
        }

        const channel = message.channel;
        const channelName = channel.name;
        const channelPosition = channel.position;
        const channelParent = channel.parent;
        const channelPermissions = channel.permissionOverwrites.cache.map(overwrite => ({
            id: overwrite.id,
            allow: overwrite.allow.bitfield,
            deny: overwrite.deny.bitfield
        }));

        try {
            // Delete the channel
            await channel.delete('Channel renewal requested');

            // Recreate the channel with the same permissions, position, and parent
            const newChannel = await message.guild.channels.create({
                name: channelName,
                type: channel.type,
                parent: channelParent,
                permissionOverwrites: channelPermissions
            });

            // Set the position of the new channel
            await newChannel.setPosition(channelPosition);

            // Send the reply in the new channel
            newChannel.send(`Le salon ${channelName} a été recréé avec succès.`);
        } catch (error) {
            console.error('Erreur lors de la recréation du salon:', error);
            message.author.send('Une erreur est survenue lors de la recréation du salon.');
        }
    }
};