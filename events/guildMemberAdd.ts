import { GuildMember } from 'discord.js';
import GuildConfig from '../models/GuildConfig';

export default {
    name: 'guildMemberAdd',
    once: false,
    async execute(member: GuildMember) {
        if (member.user.bot) return;

        try {
            const guildConfig = await GuildConfig.findOne({ guildId: member.guild.id });

            if (guildConfig && guildConfig.memberRoleId) {
                const role = member.guild.roles.cache.get(guildConfig.memberRoleId);

                if (role) {
                    await member.roles.add(role);
                } else {
                    console.log(`Role with ID ${guildConfig.memberRoleId} not found in guild ${member.guild.id}.`);
                }
            }
        } catch (error) {
            console.error(`Error assigning role to new member in guild ${member.guild.id}:`, error);
        }
    },
};

