import { GuildMember, TextChannel } from 'discord.js';
import GuildConfig from '../models/GuildConfig';
import { log, logError } from "../utils/LogUtils";

export default {
    name: 'guildMemberAdd',
    once: false,
    async execute(member: GuildMember) {
        if (member.user.bot) return;

        try {
            const guildConfig = await GuildConfig.findOne({ guildId: member.guild.id });

            if (guildConfig) {
                if (guildConfig.memberRoleId) {
                    const role = member.guild.roles.cache.get(guildConfig.memberRoleId);

                    if (role) {
                        await member.roles.add(role).catch(e => {
                            logError(member.client, member.guild.id, 'guildMemberAdd Event', e);
                        });
                        await log(member.client, member.guild.id, `Assigned role ${role.name} to new member ${member.user.tag}.`);
                    } else {
                        console.log(`Role with ID ${guildConfig.memberRoleId} not found in guild ${member.guild.id}.`);
                    }
                }

                if (guildConfig.welcomeChannelId && guildConfig.welcomeMessage) {
                    const channel = member.guild.channels.cache.get(guildConfig.welcomeChannelId) as TextChannel;

                    if (channel) {
                        const welcomeMessage = guildConfig.welcomeMessage.replace(/{{user}}/g, member.toString());
                        await channel.send(welcomeMessage);
                    } else {
                        console.log(`Welcome channel with ID ${guildConfig.welcomeChannelId} not found in guild ${member.guild.id}.`);
                    }
                }
            }
        } catch (error) {
            console.error(`Error in guildMemberAdd event for guild ${member.guild.id}:`, error);
        }
    },
};
