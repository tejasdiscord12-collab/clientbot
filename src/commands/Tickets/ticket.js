const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, StringSelectMenuBuilder } = require('discord.js');
const db = require('../../database');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Ticket system commands.')
        .addSubcommand(subcommand =>
            subcommand.setName('setup')
                .setDescription('Sets up the ticket system.')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to send the ticket panel to')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction) {
        const { options, guild } = interaction;
        const subcommand = options.getSubcommand();

        if (subcommand === 'setup') {
            const targetChannel = options.getChannel('channel');

            const embed = new EmbedBuilder()
                .setTitle('🛠️ Help Desk')
                .setDescription(
                    `🚨 **To ensure efficient support, please select the correct category below.**\n\n` +
                    `• **Purchase:** VPS or Server hosting help.\n` +
                    `• **Support:** General questions.\n` +
                    `• **Bugs:** Report technical issues.\n\n` +
                    `Click the dropdown menu to open a ticket.`
                )
                .setFooter({ text: `Desact.Core • ${guild.name}` })
                .setTimestamp()
                .setColor('#2B2D31');

            const row = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('ticket_select')
                        .setPlaceholder('Select a support option')
                        .addOptions(
                            { label: 'Purchase', description: 'VPS or Server purchase help', value: 'purchase', emoji: '💳' },
                            { label: 'Support', description: 'General questions', value: 'support', emoji: '✉️' },
                            { label: 'Bugs', description: 'Report a bug', value: 'bug_report', emoji: '⚠️' },
                        ),
                );

            await targetChannel.send({ embeds: [embed], components: [row] });
            return await interaction.reply({ content: `✅ Ticket panel sent to ${targetChannel}`, ephemeral: true });
        }
    }
};
