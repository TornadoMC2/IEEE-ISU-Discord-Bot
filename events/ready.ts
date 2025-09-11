import *  as Discord from "discord.js";
import mongoose from "mongoose";
let { mongoURI } = require('../secrets.json');

module.exports = {
	name: Discord.Events.ClientReady,
	once: true,
	async execute(client : Discord.Client) {

		// Connect to MongoDB
		// @ts-ignore
		await mongoose.connect(mongoURI).then(r => {
			console.log('Connected to MongoDB');
		}).catch((e: Error) => {
			console.log(`Error connecting to MongoDB: ${e.message}`);
		});

		console.log(`Ready! Logged in as ${client.user?.tag}`);

	},
};