const { ActivityType } = require('discord.js');
const colors = require('colors');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(colors.cyan(`[Client] :: Logged in as ${client.user.tag}`));

        client.user.setPresence({
            activities: [{ name: '/help | Nexter Cloud', type: ActivityType.Watching }],
            status: 'online'
        });
    },
};
