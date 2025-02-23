module.exports = {
    formatMemberData: (member) => {
        return {
            id: member.id,
            username: member.user.username,
            discriminator: member.user.discriminator,
            joinedAt: member.joinedAt,
            roles: member.roles.cache.map(role => role.name),
        };
    },

    validateInput: (input) => {
        return typeof input === 'string' && input.trim().length > 0;
    },

    logError: (error) => {
        console.error(`[ERROR] ${new Date().toISOString()}: ${error.message}`);
    },

    getServerInfo: (guild) => {
        return {
            id: guild.id,
            name: guild.name,
            memberCount: guild.memberCount,
            createdAt: guild.createdAt,
        };
    }
};