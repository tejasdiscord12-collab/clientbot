const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const db = require('../database');
const fs = require('fs');

const usersMap = new Map();
const LIMIT = 5;
const TIME = 3000; // 3 seconds

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        // Anti-Spam System
        if (usersMap.has(message.author.id)) {
            const userData = usersMap.get(message.author.id);
            let { msgCount, lastMessage } = userData;
            const diff = Date.now() - lastMessage;

            if (diff > TIME) {
                // Reset if time passed
                userData.msgCount = 1;
                userData.lastMessage = Date.now();
            } else {
                userData.msgCount++;
            }

            if (userData.msgCount > LIMIT) {
                try {
                    await message.delete();
                    // Auto-Warn the user
                    db.addWarn(
                        message.guild.id,
                        message.author.id,
                        message.author.tag,
                        client.user.id,
                        client.user.tag,
                        'Automated: Anti-Spam (Sending messages too fast)'
                    );

                    const warnMsg = await message.channel.send(`${message.author}, please do not spam! You have been automatically warned.`);
                    setTimeout(() => warnMsg.delete().catch(() => { }), 5000);
                    return;
                } catch (err) {
                    console.error('Anti-Spam Error:', err);
                }
            }
        } else {
            usersMap.set(message.author.id, {
                msgCount: 1,
                lastMessage: Date.now()
            });
        }
        console.log(`[Message] From ${message.author.tag}: ${message.content}`);

        // Fallback Text Command for Ticket Support
        if (message.content.startsWith('!cmf')) {
            // Temporarily removed permissions check for testing
            // if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

            const imagePath = './assets/banner.jpg';
            let files = [];
            try {
                if (fs.existsSync(imagePath)) {
                    const attachment = new AttachmentBuilder(imagePath, { name: 'banner.jpg' });
                    files.push(attachment);
                }
            } catch (e) {
                console.error('Failed to load support banner:', e.message);
            }

            const embed = new EmbedBuilder()
                .setTitle('📩 Nexter Cloud | Support Center')
                .setDescription('Welcome to the **Nexter Cloud Support System**. \n\nNeed help? Click the button below to open a ticket and our staff team will assist you shortly.\n\n**Categories:**\n• Support & Help\n• Server Reports\n• Feedback & Suggestions')
                .setFooter({ text: `Nexter Cloud • ${message.guild.name}`, iconURL: message.guild.iconURL() })
                .setTimestamp()
                .setColor('#5865F2');

            if (files.length > 0) embed.setImage('attachment://banner.jpg');

            const button = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('create_ticket')
                        .setLabel('Create Ticket')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🎫')
                );

            const channel = message.mentions.channels.first() || message.channel;
            await channel.send({ embeds: [embed], components: [button], files: [attachment] });
            const reply = await message.reply(`Ticket panel sent to ${channel}`);
            setTimeout(() => {
                reply.delete().catch(() => { });
                message.delete().catch(() => { });
            }, 5000);
            return;
        }

        // Auto Delete Abusive Words
        const badWords = ['badword1', 'badword2', 'abuse'];
        const content = message.content.toLowerCase();
        const foundBadWord = badWords.some(word => content.includes(word));

        if (foundBadWord) {
            if (message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                try {
                    await message.delete();
                    const warningMsg = await message.channel.send(`${message.author}, please do not use abusive language!`);
                    setTimeout(() => warningMsg.delete().catch(() => { }), 5000);
                } catch (err) {
                    console.error('Failed to delete message:', err);
                }
            }
            return; // Stop processing if bad word found
        }

        // Custom Commands
        try {
            const customCmd = db.getCustomCommand(message.guild.id, message.content.trim());
            if (customCmd) {
                await message.channel.send(customCmd.Response);
            }
        } catch (error) {
            console.error('Error fetching custom command:', error);
        }
    },
};
