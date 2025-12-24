const db = require('../database');

module.exports = {
    name: 'guildMemberRemove',
    async execute(member, client) {
        // Invite tracking for leavers
        const newInvites = await member.guild.invites.fetch().catch(() => null);
        const oldInvites = client.invites.get(member.guild.id);

        // Find who invited the person who just left
        // Note: This is a bit complex as we don't know for sure who invited them unless we stored it on join.
        // For now, we'll mark it as a 'left' invite if we can find a matching record in the DB.
        // A better way would be to store the inviter ID in the DB when the user joins.

        // Update Cache
        if (newInvites) {
            client.invites.set(member.guild.id, new Map(newInvites.map((invite) => [invite.code, invite.uses])));
        }

        // Find who invited the person who just left
        const inviterId = db.getMemberInviter(member.guild.id, member.id);
        if (inviterId) {
            // Mark as 'left' in the database
            await db.addInvite(member.guild.id, inviterId, 1, 'left');

            // Optionally, we could also decrement 'regular' or 'fake' if we stored which type it was.
            // For now, addInvite handles the Total calculation (Regular - Fake - Left).

            // Clean up the mapping
            db.removeMemberInvite(member.guild.id, member.id);
        }
    }
};
