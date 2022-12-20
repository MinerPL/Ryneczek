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
		const dirs = readdirSync(`${__dirname}/../../commands`);

		for(const dir of dirs) {
			const files = readdirSync(`${__dirname}/../../commands/${dir}`);

			for (const file of files) {
				if(!file.endsWith('.js')) continue;

				const command = await (await import(`${__dirname}/../../commands/${dir}/${file}`));

				this.set(command.data.name, { ...command });
			}
		}
		console.log(`${this.size} commands loaded.`);
		return this;
	}
}