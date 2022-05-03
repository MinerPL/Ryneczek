import { readdirSync } from 'fs';
import Ryneczek from '@classes/Client';
import { Collection, Interaction } from 'discord.js';

export class InteractionHandler extends Collection<string, Interaction> {
	client: typeof Ryneczek;
	constructor(client) {
		super();
		this.client = client;
	}

	async loadInteractions() {
		const files = readdirSync(`${__dirname}/../../interactions`);
		for(const file of files) {
			if(!file.endsWith('.js')) continue;

			const interaction = await (await import(`${__dirname}/../../interactions/${file}`)).default;

			this.set(interaction.name, interaction);
		}
		console.log(`${files.length} interactions loaded.`);
		return this;
	}
}