import { Client, Guild, TextChannel, EmbedBuilder } from 'discord.js';
import GuildConfig from '../models/GuildConfig';

export async function log(client: Client, guildId: string, message: string) {
    console.log(message); // Also log to console as a fallback

    try {
        const guildConfig = await GuildConfig.findOne({ guildId });
        if (guildConfig && guildConfig.logChannelId) {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return;

            const logChannel = guild.channels.cache.get(guildConfig.logChannelId) as TextChannel;
            if (logChannel) {
                await logChannel.send(message);
            }
        }
    } catch (error) {
        console.error('Error sending log message to channel:', error);
    }
}

export async function logError(client: Client, guildId: string, commandName: string, error: Error) {
    console.error(`Error in command ${commandName} in guild ${guildId}:`, error);

    try {
        const guildConfig = await GuildConfig.findOne({ guildId });
        if (guildConfig && guildConfig.logChannelId) {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return;

            const logChannel = guild.channels.cache.get(guildConfig.logChannelId) as TextChannel;
            if (logChannel) {
                const embed = new EmbedBuilder()
                    .setTitle('Error Log')
                    .setColor('Red')
                    .addFields(
                        { name: 'Guild', value: guild.name, inline: true },
                        { name: 'Command', value: commandName, inline: true },
                        { name: 'Error', value: `\`\`\`${error.stack || error.message}\`\`\`` }
                    )
                    .setTimestamp();
                await logChannel.send({ embeds: [embed] });
            }
        }
    } catch (e) {
        console.error('Error sending error log to channel:', e);
    }
}

