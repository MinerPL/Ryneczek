import { readdirSync } from "fs";
import Ryneczek from "#client";
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class EventHandler {
	client: Ryneczek;
	constructor(client: Ryneczek) {
		this.client = client;
	}

	async loadEvents() {
		let i = 0;
		const dirs = readdirSync(`${__dirname}/../../events`);

		for (const dir of dirs) {
			const files = readdirSync(`${__dirname}/../../events/${dir}`);

			for (const rawFile of files) {
				if (!rawFile.endsWith(".js")) {
					continue;
				}
				const file = await import(
						`file:${join(__dirname, '../../events', dir, rawFile)}`
					);

				this.client.on(rawFile.slice(0, -3), (...event) => {
					file.run(this.client, ...event);
				});
				i++;
			}
		}

		console.log(`${i} events loaded.`);
	}
}
