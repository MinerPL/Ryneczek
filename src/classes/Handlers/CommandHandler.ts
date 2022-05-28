import { readdirSync } from 'fs';
import Ryneczek from '@classes/Ryneczek';
import { Collection } from 'discord.js';
import { Command } from 'types/Commands';

export class CommandHandler extends Collection<string, Command> {
	client: typeof Ryneczek;
	constructor(client) {
		super();
		this.client = client;
	}

	async loadCommands() {
		const files = readdirSync(`${__dirname}/../../commands`);
		for(const file of files) {
			if(!file.endsWith('.js')) continue;

			const command = await (await import(`${__dirname}/../../commands/${file}`)).default;

			this.set(command.name, command);
		}
		console.log(`${files.length} commands loaded.`);
		return this;
	}
}