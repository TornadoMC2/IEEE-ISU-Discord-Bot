'use strict';
import * as fs from 'fs';
import * as path from 'path';
import * as Discord from 'discord.js';
let { token } = require('./token.json');

const client : Discord.Client = new Discord.Client({ intents: [Discord.GatewayIntentBits.Guilds] });


// Create a new Collection where the key is the command name and the value is the exported module

declare module 'discord.js' { interface Client { commands: Discord.Collection<string, any> } }

client.commands = new Discord.Collection<string, any>();

const foldersPath : string = path.join(__dirname, 'commands');
const commandFolders : string[] = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath: string = path.join(foldersPath, folder);
	const commandFiles: string[] = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	let file;
	for (file of commandFiles) {
		const filePath: string = path.join(commandsPath, file);
		const command: any = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

const eventsPath : string = path.join(__dirname, 'events');
const eventFiles : string[] = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath : string = path.join(eventsPath, file);
	const event : any = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

client.login(token).then((r: string) : void => {console.log(r)});