const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Ticket = require('../models/Ticket');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        // Handle slash commands
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(error);
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        }

        // Handle select menu interactions
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'ticket_select') {
                try {
                    await interaction.deferReply({ ephemeral: true });

                    const { guild, user, values } = interaction;
                    const ticketType = values[0]; // purchase, support, or bug_report

                    // Check if user already has an open ticket
                    const existingTicket = await Ticket.findOne({
                        GuildID: guild.id,
                        OpenBy: user.id,
                        Closed: false
                    });

                    if (existingTicket) {
                        return await interaction.editReply({
                            content: `❌ You already have an open ticket: <#${existingTicket.ChannelID}>`,
                            ephemeral: true
                        });
                    }

                    // Get next ticket number
                    const ticketCount = await Ticket.countDocuments({ GuildID: guild.id });
                    const ticketNumber = String(ticketCount + 1).padStart(4, '0');

                    // Determine ticket category name and emoji
                    let categoryName, emoji;
                    switch (ticketType) {
                        case 'purchase':
                            categoryName = 'Purchase';
                            emoji = '💳';
                            break;
                        case 'support':
                            categoryName = 'Support';
                            emoji = '✉️';
                            break;
                        case 'bug_report':
                            categoryName = 'Bug Report';
                            emoji = '⚠️';
                            break;
                        default:
                            categoryName = 'Support';
                            emoji = '🎫';
                    }

                    // Create ticket channel
                    const ticketChannel = await guild.channels.create({
                        name: `ticket-${ticketNumber}`,
                        type: ChannelType.GuildText,
                        topic: `${categoryName} ticket opened by ${user.tag}`,
                        permissionOverwrites: [
                            {
                                id: guild.id,
                                deny: [PermissionFlagsBits.ViewChannel]
                            },
                            {
                                id: user.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ReadMessageHistory,
                                    PermissionFlagsBits.AttachFiles
                                ]
                            },
                            {
                                id: client.user.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ManageChannels
                                ]
                            }
                        ]
                    });

                    // Save ticket to database
                    const newTicket = new Ticket({
                        GuildID: guild.id,
                        TicketID: ticketNumber,
                        ChannelID: ticketChannel.id,
                        Closed: false,
                        Locked: false,
                        Type: ticketType,
                        Claimed: false,
                        ClaimedBy: null,
                        OpenBy: user.id
                    });

                    await newTicket.save();

                    // Create ticket embed
                    const ticketEmbed = new EmbedBuilder()
                        .setTitle(`${emoji} ${categoryName} Ticket`)
                        .setDescription(
                            `Welcome ${user}!\n\n` +
                            `**Ticket ID:** #${ticketNumber}\n` +
                            `**Category:** ${categoryName}\n\n` +
                            `Please describe your issue in detail. A staff member will assist you shortly.`
                        )
                        .setColor('#2B2D31')
                        .setTimestamp()
                        .setFooter({ text: `Ticket #${ticketNumber}` });

                    // Create buttons
                    const buttonRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('ticket_close')
                                .setLabel('Close Ticket')
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('🔒'),
                            new ButtonBuilder()
                                .setCustomId('ticket_claim')
                                .setLabel('Claim')
                                .setStyle(ButtonStyle.Primary)
                                .setEmoji('✋')
                        );

                    await ticketChannel.send({
                        content: `${user}`,
                        embeds: [ticketEmbed],
                        components: [buttonRow]
                    });

                    await interaction.editReply({
                        content: `✅ Ticket created: ${ticketChannel}`,
                        ephemeral: true
                    });

                } catch (error) {
                    console.error('Error creating ticket:', error);
                    if (interaction.deferred) {
                        await interaction.editReply({
                            content: '❌ There was an error creating your ticket. Please try again later.',
                            ephemeral: true
                        });
                    }
                }
            }
        }

        // Handle button interactions
        if (interaction.isButton()) {
            const { customId, guild, user, channel } = interaction;

            // Close ticket button
            if (customId === 'ticket_close') {
                try {
                    await interaction.deferReply({ ephemeral: true });

                    const ticket = await Ticket.findOne({
                        GuildID: guild.id,
                        ChannelID: channel.id,
                        Closed: false
                    });

                    if (!ticket) {
                        return await interaction.editReply({
                            content: '❌ This ticket is already closed or not found.',
                            ephemeral: true
                        });
                    }

                    // Generate transcript
                    const messages = await channel.messages.fetch({ limit: 100 });
                    const sortedMessages = [...messages.values()].reverse();

                    let transcript = `Ticket Transcript - #${ticket.TicketID}\n`;
                    transcript += `Opened by: ${user.tag}\n`;
                    transcript += `Closed at: ${new Date().toLocaleString()}\n`;
                    transcript += `Category: ${ticket.Type}\n`;
                    transcript += `\n${'='.repeat(50)}\n\n`;

                    // Get unique participants
                    const participants = new Set();
                    sortedMessages.forEach(msg => {
                        if (!msg.author.bot) participants.add(msg.author.tag);
                    });

                    sortedMessages.forEach(msg => {
                        const timestamp = msg.createdAt.toLocaleString();
                        transcript += `[${timestamp}] ${msg.author.tag}: ${msg.content}\n`;
                        if (msg.attachments.size > 0) {
                            msg.attachments.forEach(att => {
                                transcript += `  📎 Attachment: ${att.url}\n`;
                            });
                        }
                        transcript += '\n';
                    });

                    // Create transcript embed
                    const transcriptEmbed = new EmbedBuilder()
                        .setTitle(`🎫 Ticket Closed - #${ticket.TicketID}`)
                        .setDescription(
                            `**Ticket Creator:** <@${ticket.OpenBy}>\n` +
                            `**Participants:** ${participants.size}\n` +
                            `**Closed by:** ${user}\n` +
                            `**Reason:** Ticket closed by user`
                        )
                        .setColor('#FF0000')
                        .setTimestamp();

                    // Send transcript to ticket creator
                    try {
                        const ticketCreator = await client.users.fetch(ticket.OpenBy);
                        await ticketCreator.send({
                            embeds: [transcriptEmbed],
                            files: [{
                                attachment: Buffer.from(transcript, 'utf-8'),
                                name: `ticket-${ticket.TicketID}-transcript.txt`
                            }]
                        });
                    } catch (error) {
                        console.log('Could not DM transcript to user:', error.message);
                    }

                    // Update ticket in database
                    ticket.Closed = true;
                    await ticket.save();

                    await interaction.editReply({
                        content: '✅ Ticket closed. Transcript has been sent to your DMs. Channel will be deleted in 5 seconds.',
                        ephemeral: true
                    });

                    // Delete channel after 5 seconds
                    setTimeout(async () => {
                        try {
                            await channel.delete();
                        } catch (error) {
                            console.error('Error deleting ticket channel:', error);
                        }
                    }, 5000);

                } catch (error) {
                    console.error('Error closing ticket:', error);
                    if (interaction.deferred) {
                        await interaction.editReply({
                            content: '❌ There was an error closing the ticket.',
                            ephemeral: true
                        });
                    }
                }
            }

            // Claim ticket button
            if (customId === 'ticket_claim') {
                try {
                    await interaction.deferReply({ ephemeral: false });

                    const ticket = await Ticket.findOne({
                        GuildID: guild.id,
                        ChannelID: channel.id,
                        Closed: false
                    });

                    if (!ticket) {
                        return await interaction.editReply({
                            content: '❌ Ticket not found.',
                            ephemeral: true
                        });
                    }

                    if (ticket.Claimed) {
                        return await interaction.editReply({
                            content: `❌ This ticket has already been claimed by <@${ticket.ClaimedBy}>`,
                            ephemeral: true
                        });
                    }

                    // Update ticket
                    ticket.Claimed = true;
                    ticket.ClaimedBy = user.id;
                    await ticket.save();

                    const claimEmbed = new EmbedBuilder()
                        .setDescription(`✅ ${user} has claimed this ticket.`)
                        .setColor('#00FF00')
                        .setTimestamp();

                    await interaction.editReply({
                        embeds: [claimEmbed]
                    });

                } catch (error) {
                    console.error('Error claiming ticket:', error);
                    if (interaction.deferred) {
                        await interaction.editReply({
                            content: '❌ There was an error claiming the ticket.',
                            ephemeral: true
                        });
                    }
                }
            }
        }
    },
};
