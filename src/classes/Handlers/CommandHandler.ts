import { readdirSync } from "fs";
import Ryneczek from "#client";
import { Collection } from "discord.js";
import { Command } from "#types/Commands";
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class CommandHandler extends Collection<string, Command> {
	client: typeof Ryneczek;
	constructor(client) {
		super();
		this.client = client;
	}

	async loadCommands() {
		const dirs = readdirSync(`${__dirname}/../../commands`);

		for (const dir of dirs) {
			const files = readdirSync(`${__dirname}/../../commands/${dir}`);

			for (const file of files) {
				if (!file.endsWith(".js")) {
					continue;
				}

				const command = await import(
					`file:${join(__dirname, '../../commands', dir, file)}`
					);

				this.set(command.data.name, { ...command });
			}
		}
		console.log(`${this.size} commands loaded.`);
		return this;
	}
}
