import { readdirSync } from "fs";
import Ryneczek from "#client";
import { Collection } from "discord.js";
import { InteractionType } from "#types/Commands";
import {fileURLToPath} from "node:url";
import {dirname, join} from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class InteractionHandler extends Collection<string, InteractionType> {
	client: typeof Ryneczek;
	constructor(client) {
		super();
		this.client = client;
	}

	async loadInteractions() {
		const files = readdirSync(`${__dirname}/../../interactions`);
		for (const file of files) {
			if (!file.endsWith(".js")) {
				continue;
			}

			const interaction = await import(
				`file:${join(__dirname, '../../interactions', file)}`
				);

			this.set(file.slice(0, -3), interaction);
		}
		console.log(`${files.length} interactions loaded.`);
		return this;
	}
}
