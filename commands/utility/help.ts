import { CommandInteraction, EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from "discord.js";
import * as path from "node:path";
import * as fs from "node:fs";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows the help menu.'),
    async execute(interaction: CommandInteraction) {
        const commands: any[] = [];
        const foldersPath: string = path.normalize(path.join(__dirname, '../', '../commands'));
        const commandFolders: string[] = fs.readdirSync(foldersPath);
        for (const folder of commandFolders) {
            const commandsPath: string = path.join(foldersPath, folder);
            const commandFiles: string[] = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const filePath: string = path.join(commandsPath, file);
                const command = require(filePath);
                if ('data' in command && 'execute' in command) {
                    commands.push(command.data.toJSON());
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            }
        }

        const itemsPerPage = 5;
        const totalPages = Math.ceil(commands.length / itemsPerPage);

        let currentPage = 0;

        const generateEmbed = (page: number) => {
            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const currentCommands = commands.slice(start, end);

            const helpMenu = new EmbedBuilder()
                .setTitle("Help Menu")
                .setDescription("Here are the commands you can use:")
                .setColor("Blue");

            currentCommands.forEach((command) => {
                let name = command.name;
                let description = command.description;

                if (command.hasOwnProperty('options')) {
                    let options = '';
                    command.options.forEach((option: any) => {
                        options += `\n\`${option.name}\` - ${option.description}`;
                    });
                    description += options;
                }

                helpMenu.addFields({ name: name, value: description });
            });

            helpMenu.setFooter({ text: `Page ${page + 1} of ${totalPages}` });

            return helpMenu;
        };

        const row = () => new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === totalPages - 1)
            );

        const message = await interaction.reply({ embeds: [generateEmbed(currentPage)], components: [row()], fetchReply: true });

        const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                await i.reply({ content: 'You cannot use these buttons.', ephemeral: true });
                return;
            }

            if (i.customId === 'prev' && currentPage > 0) {
                currentPage--;
            } else if (i.customId === 'next' && currentPage < totalPages - 1) {
                currentPage++;
            }

            await i.update({ embeds: [generateEmbed(currentPage)], components: [row()] });
        });

        collector.on('end', () => {
            const disabledRow = row();
            disabledRow.components.forEach(button => button.setDisabled(true));
            message.edit({ components: [disabledRow] });
        });
    }
};