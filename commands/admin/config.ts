import {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType,
    StringSelectMenuBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ChannelType,
    Interaction,
    AnySelectMenuInteraction,
    ModalSubmitInteraction,
} from 'discord.js';
import { CommandInteraction, PermissionsBitField, Role, TextChannel, ChannelSelectMenuBuilder } from 'discord.js';
import GuildConfig, { IGuildConfig } from '../../models/GuildConfig';

interface ConfigOption {
    name: string;
    description: string;
    key: keyof Omit<IGuildConfig, '_id' | 'guildId'>;
    type: 'role' | 'channel' | 'string';
    channelTypes?: ChannelType[];
}

const configOptions: ConfigOption[] = [
    {
        name: 'Member Role',
        description: 'The role assigned to new members.',
        key: 'memberRoleId',
        type: 'role',
    },
    {
        name: 'Welcome Channel',
        description: 'The channel where welcome messages are sent.',
        key: 'welcomeChannelId',
        type: 'channel',
        channelTypes: [ChannelType.GuildText],
    },
    {
        name: 'Welcome Message',
        description: 'The message sent when a new member joins. Use {{user}} for user mention.',
        key: 'welcomeMessage',
        type: 'string',
    },
    {
        name: 'Log Channel',
        description: 'The channel where bot logs are sent.',
        key: 'logChannelId',
        type: 'channel',
        channelTypes: [ChannelType.GuildText],
    },
];

async function buildMainMenu(interaction: CommandInteraction) {
    if (!interaction.guild) return { embeds: [], components: [] };

    const config = await GuildConfig.findOneAndUpdate(
        { guildId: interaction.guildId },
        {},
        { upsert: true, new: true }
    );

    const embed = new EmbedBuilder()
        .setTitle('Server Configuration')
        .setDescription('Select a category to configure.')
        .setColor('Blurple');

    for (const option of configOptions) {
        let value = 'Not Set';
        const configValue = config?.[option.key];
        if (configValue) {
            if (option.type === 'role') {
                const role = interaction.guild.roles.cache.get(configValue as string);
                value = role ? role.name : 'Role not found';
            } else if (option.type === 'channel') {
                const channel = interaction.guild.channels.cache.get(configValue as string);
                value = channel ? `#${channel.name}` : 'Channel not found';
            } else {
                value = configValue as string;
            }
        }
        embed.addFields({ name: option.name, value: value, inline: true });
    }

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('config_select')
        .setPlaceholder('Select an option to configure')
        .addOptions(
            configOptions.map(option => ({
                label: option.name,
                description: option.description,
                value: option.key,
            }))
        );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const cancelRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId('config_cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger)
    );

    return { embeds: [embed], components: [row, cancelRow] };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configure bot settings for this server.'),
        //.setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
    async execute(interaction: CommandInteraction) {
        if (!interaction.isChatInputCommand() || !interaction.guildId) {
            await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
            return;
        }

        if(interaction.user.id !== "425624104901541888") return await interaction.reply({content: "You do not have permission to use this command.", ephemeral: true});

        const menu = await buildMainMenu(interaction);
        const message = await interaction.reply({ ...menu, ephemeral: true, fetchReply: true });

        const collector = message.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 300000, // 5 minutes
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                await i.reply({ content: 'You cannot use this menu.', ephemeral: true });
                return;
            }

            if (i.isButton()) {
                if (i.customId === 'config_cancel') {
                    await i.update({ content: 'Configuration cancelled.', components: [] });
                    collector.stop();
                }
                return;
            }

            if (!i.isStringSelectMenu()) return;

            const selectedKey = i.values[0];
            const option = configOptions.find(o => o.key === selectedKey);

            if (!option) {
                await i.reply({ content: 'Invalid option selected.', ephemeral: true });
                return;
            }

            if (option.type === 'role') {
                const roleMenu = new StringSelectMenuBuilder()
                    .setCustomId(`config_set_${option.key}`)
                    .setPlaceholder('Select a role');

                const roles = i.guild?.roles.cache.filter(r => !r.managed && r.name !== '@everyone');
                if (roles && roles.size > 0) {
                    roleMenu.addOptions(roles.map(r => ({ label: r.name, value: r.id })).slice(0, 25));
                    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(roleMenu);
                    await i.reply({ content: `Select the new ${option.name}.`, components: [row], ephemeral: true });
                } else {
                    await i.reply({ content: 'No roles available to select.', ephemeral: true });
                }
            } else if (option.type === 'channel') {
                const channelMenu = new ChannelSelectMenuBuilder()
                    .setCustomId(`config_set_${option.key}`)
                    .setPlaceholder(`Select a channel for ${option.name}`)
                    .setChannelTypes(option.channelTypes || [ChannelType.GuildText]);

                const row = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelMenu);
                await i.reply({ content: `Select the new ${option.name}.`, components: [row], ephemeral: true });
            } else if (option.type === 'string') {
                const modal = new ModalBuilder()
                    .setCustomId(`config_modal_${option.key}`)
                    .setTitle(`Set ${option.name}`);

                const input = new TextInputBuilder()
                    .setCustomId('value')
                    .setLabel('New value')
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(((await GuildConfig.findOne({ guildId: i.guildId }))?.[option.key] as string) || '');

                const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
                modal.addComponents(row);
                await i.showModal(modal);
            }

            const responseCollector = i.channel?.createMessageComponentCollector({ filter: (m) => m.user.id === i.user.id, time: 60000 }) || i.awaitModalSubmit({ filter: (m) => m.user.id === i.user.id, time: 60000 });

            const handleUpdate = async (collectedInteraction: Interaction, value: string) => {
                if (!collectedInteraction.isRepliable()) return;
                try {
                    await GuildConfig.findOneAndUpdate(
                        { guildId: i.guildId },
                        { [option.key]: value },
                        { upsert: true, new: true }
                    );
                    const updatedMenu = await buildMainMenu(interaction);
                    await interaction.editReply(updatedMenu);
                    await collectedInteraction.reply({ content: `${option.name} has been updated.`, ephemeral: true });
                } catch (error) {
                    console.error(error);
                    await collectedInteraction.reply({ content: 'There was an error saving the configuration.', ephemeral: true });
                }
            };

            if (responseCollector instanceof Promise) { // It's a modal submit interaction promise
                try {
                    const modalInteraction = await responseCollector;
                    const value = modalInteraction.fields.getTextInputValue('value');
                    await handleUpdate(modalInteraction, value);
                } catch (e) {
                    // Timeout
                }
            } else if (responseCollector) { // It's a component collector
                responseCollector.on('collect', async (ci: AnySelectMenuInteraction) => {
                    if (ci.isStringSelectMenu() || ci.isChannelSelectMenu()) {
                        await handleUpdate(ci, ci.values[0]);
                    }
                });
            }
        });

        collector.on('end', async () => {
            try {
                await interaction.editReply({ content: 'Configuration menu has expired.', components: [] });
            } catch (error) {
                // Ignore errors if the message was deleted
            }
        });
    },
};
