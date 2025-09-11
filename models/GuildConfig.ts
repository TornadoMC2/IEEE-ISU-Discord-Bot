import { Schema, model, Document } from 'mongoose';

export interface IGuildConfig extends Document {
    guildId: string;
    memberRoleId?: string;
    welcomeChannelId?: string;
    welcomeMessage?: string;
    logChannelId?: string;
}

const guildConfigSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true,
    },
    memberRoleId: {
        type: String,
        required: false,
    },
    welcomeChannelId: {
        type: String,
        required: false,
    },
    welcomeMessage: {
        type: String,
        required: false,
        default: 'Welcome to the server, {{user}}!',
    },
    logChannelId: {
        type: String,
        required: false,
    },
});

export default model<IGuildConfig>('GuildConfig', guildConfigSchema);
