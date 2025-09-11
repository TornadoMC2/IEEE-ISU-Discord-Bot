import {CommandInteraction, SlashCommandBuilder, MessageFlags} from "discord.js";
import {ErrorEmbed} from "../../utils/EmbedUtils";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction: CommandInteraction) {
        await interaction.reply({content: 'Pong!'})
    }
}