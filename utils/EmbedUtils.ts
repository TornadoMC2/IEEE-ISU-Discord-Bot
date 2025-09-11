import {EmbedBuilder} from "discord.js";

export const ErrorEmbed : EmbedBuilder = new EmbedBuilder()
    .setTitle("Error")
    .setDescription("An error occured! :(")
    .setColor("Red")


export const SuccessEmbed : EmbedBuilder = new EmbedBuilder()
    .setTitle("Success")
    .setDescription("Success!")
    .setColor("Green")