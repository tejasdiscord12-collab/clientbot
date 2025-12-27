const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database.json');

// Initialize DB file if not exists
if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({
        warns: [],
        tickets: [],
        customCommands: [],
        welcomeSettings: [],
        statusSettings: {},
        invites: [],
        giveaways: [],
        ticketSettings: [],
        ticketSupportRoles: [],
        memberInvites: []
    }, null, 4));
}

const defaultDB = {
    warns: [],
    tickets: [],
    customCommands: [],
    welcomeSettings: [],
    statusSettings: {},
    invites: [],
    giveaways: [],
    ticketSettings: [],
    ticketSupportRoles: [],
    memberInvites: []
};

function readDB() {
    try {
        if (!fs.existsSync(dbPath)) return { ...defaultDB };
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        return { ...defaultDB, ...data };
    } catch (e) {
        console.error('Error reading database, returning defaults:', e);
        return { ...defaultDB };
    }
}

function writeDB(data) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 4));
    } catch (e) {
        console.error('Error writing database:', e);
    }
}

module.exports = {
    // Invites (Stats)
    addInvite: (guildId, userId, amount, type) => {
        const db = readDB();
        let userInvites = db.invites.find(i => i.GuildID === guildId && i.UserID === userId);
        if (!userInvites) {
            userInvites = { GuildID: guildId, UserID: userId, Regular: 0, Fake: 0, Left: 0, Total: 0 };
            db.invites.push(userInvites);
        }
        if (type === 'regular') userInvites.Regular += amount;
        else if (type === 'fake') userInvites.Fake += amount;
        else if (type === 'left') userInvites.Left += amount;

        userInvites.Total = userInvites.Regular - userInvites.Fake - userInvites.Left;
        writeDB(db);
    },
    getInvites: (guildId, userId) => {
        const db = readDB();
        return db.invites.find(i => i.GuildID === guildId && i.UserID === userId) || { Regular: 0, Fake: 0, Left: 0, Total: 0 };
    },

    // Member Invites (Mapping who invited whom)
    addMemberInvite: (guildId, memberId, inviterId) => {
        const db = readDB();
        const index = db.memberInvites.findIndex(i => i.GuildID === guildId && i.MemberID === memberId);
        if (index !== -1) {
            db.memberInvites[index].InviterID = inviterId;
        } else {
            db.memberInvites.push({ GuildID: guildId, MemberID: memberId, InviterID: inviterId });
        }
        writeDB(db);
    },
    getMemberInviter: (guildId, memberId) => {
        const db = readDB();
        const record = db.memberInvites.find(i => i.GuildID === guildId && i.MemberID === memberId);
        return record ? record.InviterID : null;
    },
    removeMemberInvite: (guildId, memberId) => {
        const db = readDB();
        db.memberInvites = db.memberInvites.filter(i => !(i.GuildID === guildId && i.MemberID === memberId));
        writeDB(db);
    },

    // Custom Commands
    addCustomCommand: (guildId, name, response) => {
        const db = readDB();
        db.customCommands.push({ GuildID: guildId, CommandName: name, Response: response });
        writeDB(db);
    },
    getCustomCommand: (guildId, name) => {
        const db = readDB();
        const searchName = name.toLowerCase().trim();
        return db.customCommands.find(c => c.GuildID === guildId && (c.CommandName || '').toLowerCase() === searchName) || null;
    },

    // Welcome Settings
    setWelcomeChannel: (guildId, channelId) => {
        const db = readDB();
        const index = db.welcomeSettings.findIndex(s => s.GuildID === guildId);
        if (index !== -1) db.welcomeSettings[index].ChannelID = channelId;
        else db.welcomeSettings.push({ GuildID: guildId, ChannelID: channelId });
        writeDB(db);
    },
    getWelcomeChannel: (guildId) => {
        const db = readDB();
        const settings = db.welcomeSettings.find(s => s.GuildID === guildId);
        return settings ? settings.ChannelID : null;
    },

    // Warnings
    addWarn: (guildId, userId, userTag, executerId, executerTag, reason) => {
        const db = readDB();
        let userWarns = db.warns.find(w => w.GuildID === guildId && w.UserID === userId);
        const newWarn = { ExecuterID: executerId, ExecuterTag: executerTag, Reason: reason, Date: new Date().toLocaleString() };
        if (userWarns) userWarns.Content.push(newWarn);
        else db.warns.push({ GuildID: guildId, UserID: userId, UserTag: userTag, Content: [newWarn] });
        writeDB(db);
    },

    // Tickets
    createTicket: (guildId, ticketId, channelId, type, openBy) => {
        const db = readDB();
        db.tickets.push({
            GuildID: guildId,
            TicketID: ticketId,
            ChannelID: channelId,
            Closed: false,
            Locked: false,
            Type: type,
            Claimed: false,
            ClaimedBy: null,
            OpenBy: openBy
        });
        writeDB(db);
    },
    getOpenTicket: (guildId, userId) => {
        const db = readDB();
        return db.tickets.find(t => t.GuildID === guildId && t.OpenBy === userId && !t.Closed) || null;
    },
    getTicketByChannel: (guildId, channelId) => {
        const db = readDB();
        return db.tickets.find(t => t.GuildID === guildId && t.ChannelID === channelId) || null;
    },
    getTicketCount: (guildId) => {
        const db = readDB();
        return db.tickets.filter(t => t.GuildID === guildId).length;
    },
    closeTicket: (guildId, channelId) => {
        const db = readDB();
        const ticket = db.tickets.find(t => t.GuildID === guildId && t.ChannelID === channelId);
        if (ticket) {
            ticket.Closed = true;
            writeDB(db);
        }
    },
    claimTicket: (guildId, channelId, userId) => {
        const db = readDB();
        const ticket = db.tickets.find(t => t.GuildID === guildId && t.ChannelID === channelId);
        if (ticket) {
            ticket.Claimed = true;
            ticket.ClaimedBy = userId;
            writeDB(db);
        }
    }
};
