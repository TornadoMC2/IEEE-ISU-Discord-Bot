import {CommandInteraction, SlashCommandBuilder, MessageFlags} from "discord.js";
import {ErrorEmbed} from "../../utils/EmbedUtils";
import {log, logError} from "../../utils/LogUtils";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logtest')
        .setDescription('Admin command to test logging functionality.'),
    async execute(interaction: CommandInteraction) {
        if (!interaction.isChatInputCommand() || !interaction.guildId) {
            await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
            return;
        }
        if(interaction.user.id !== "425624104901541888") return await interaction.reply({content: "You do not have permission to use this command.", ephemeral: true});

        try {
            await log(interaction.client, interaction.guildId, 'This is a test log message from /logtest command.');
            await logError(interaction.client, interaction.guildId, 'logtest', new Error('This is a test error log message from /logtest command.'));
            await interaction.reply({content: 'Log test messages have been sent.', ephemeral: true});
        } catch (e) {
            console.error(e);
        }
    }
}