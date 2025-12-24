const { EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        // Invite Check Command (-i)
        if (message.content.toLowerCase().startsWith('-i')) {
            const mentionedUser = message.mentions.users.first();
            const targetUser = mentionedUser || message.author;

            const stats = db.getInvites(message.guild.id, targetUser.id);

            const embed = new EmbedBuilder()
                .setTitle(`✉️ Invites for ${targetUser.username}`)
                .addFields(
                    { name: 'Total Invites', value: `\`${stats.Total}\``, inline: true },
                    { name: 'Regular', value: `\`${stats.Regular}\``, inline: true },
                    { name: 'Fake', value: `\`${stats.Fake}\``, inline: true },
                    { name: 'Left', value: `\`${stats.Left}\``, inline: true }
                )
                .setColor('#5865F2')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await message.reply({ embeds: [embed] });
            return;
        }

        // Custom Commands
        const customCmd = db.getCustomCommand(message.guild.id, message.content.trim());
        if (customCmd) {
            await message.channel.send(customCmd.Response);
        }
    }
};
