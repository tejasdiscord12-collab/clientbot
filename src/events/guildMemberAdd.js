const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        const channelId = db.getWelcomeChannel(member.guild.id);
        if (!channelId) return;

        const channel = await member.guild.channels.fetch(channelId).catch(() => null);
        if (!channel) return;

        // Using the user's preferred banner from previous artifacts
        const imagePath = '/Users/tejas/.gemini/antigravity/brain/ca258d96-5c9d-49b3-9672-84441dc6f4b7/uploaded_image_1766042332585.jpg';
        const attachment = new AttachmentBuilder(imagePath, { name: 'welcome-banner.jpg' });

        const embed = new EmbedBuilder()
            .setTitle(`Welcome to ${member.guild.name}!`)
            .setDescription(`Hello ${member}, welcome to the server! We're glad to have you here. \n\nMake sure to read the rules and enjoy your stay!`)
            .setImage('attachment://welcome-banner.jpg')
            .setColor('#5865F2')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Member #${member.guild.memberCount}`, iconURL: member.guild.iconURL() })
            .setTimestamp();

        await channel.send({ content: `Welcome ${member}!`, embeds: [embed], files: [attachment] });
    }
};
