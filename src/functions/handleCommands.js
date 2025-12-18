const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');

module.exports = (client) => {
    client.handleCommands = async (commandFolders, path) => {
        client.commandArray = [];
        const folders = fs.readdirSync(path);
        for (const folder of folders) {
            const commandFiles = fs.readdirSync(`${path}/${folder}`).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const command = require(`../commands/${folder}/${file}`);
                client.commands.set(command.data.name, command);
                client.commandArray.push(command.data.toJSON());
            }
        }

        const rest = new REST({
            version: '9'
        }).setToken(process.env.Token);

        (async () => {
            try {
                console.log('Started refreshing application (/) commands.');

                await rest.put(
                    Routes.applicationCommands(process.env.CLIENT_ID),
                    { body: client.commandArray },
                );

                if (process.env.GUILD_ID) {
                    await rest.put(
                        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
                        { body: client.commandArray },
                    );
                    console.log(`Registered commands for test guild: ${process.env.GUILD_ID}`);
                }

                console.log('Successfully reloaded application (/) commands GLOBALLY.');
            } catch (error) {
                console.error(error);
            }
        })();
    };
};
