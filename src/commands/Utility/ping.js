const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with the bot\'s latency.'),
    async execute(interaction) {
        await interaction.reply({ content: `🏓 Pong! \`${interaction.client.ws.ping}ms\`` });
    }
};
