const { EmbedBuilder } = require('discord.js');
const db = require('../database');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        // Invite Tracking
        const newInvites = await member.guild.invites.fetch().catch(() => null);
        const oldInvites = client.invites.get(member.guild.id);
        const invite = newInvites?.find(i => i.uses > (oldInvites?.get(i.code) || 0));

        // Update Cache
        if (newInvites) {
            client.invites.set(member.guild.id, new Map(newInvites.map((invite) => [invite.code, invite.uses])));
        }

        let inviterText = 'Unknown';
        let inviteCount = 0;

        if (invite) {
            const inviter = invite.inviter;
            if (inviter) {
                inviterText = `<@${inviter.id}>`;
                // Check for fake (account age < 1 day)
                const isFake = (Date.now() - member.user.createdTimestamp) < 1000 * 60 * 60 * 24;
                await db.addInvite(member.guild.id, inviter.id, 1, isFake ? 'fake' : 'regular');

                // Store member -> inviter mapping
                db.addMemberInvite(member.guild.id, member.id, inviter.id);

                // Fetch updated invite count
                const status = db.getInvites(member.guild.id, inviter.id);
                inviteCount = status.Total;
            }
        }

        const channelId = db.getWelcomeChannel(member.guild.id);
        if (!channelId) return;

        const channel = await member.guild.channels.fetch(channelId).catch(() => null);
        if (!channel) return;

        const embed = new EmbedBuilder()
            .setTitle(`Welcome to ${member.guild.name}!`)
            .setDescription(`Hello ${member}, welcome to the server! \n\n**Invited by:** ${inviterText} (**${inviteCount}** invites)`)
            .setColor('#5865F2')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Member #${member.guild.memberCount}` })
            .setTimestamp();

        await channel.send({ content: `Welcome ${member}!`, embeds: [embed] });
    }
};
