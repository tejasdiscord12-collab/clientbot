module.exports = (client) => {
    client.handleEvents = async (eventCollection, path) => {
        const fs = require('fs');
        const eventFiles = fs.readdirSync(path).filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const event = require(`../events/${file}`);
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
        }
    };
};
