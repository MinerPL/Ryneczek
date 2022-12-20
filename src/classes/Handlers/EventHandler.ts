import Ryneczek from '@classes/Ryneczek';
import { readdirSync } from 'fs';

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

			for(const rawFile of files) {
				if (!rawFile.endsWith('.js')) continue;
				const file = await import(`${__dirname}/../../events/${dir}/${rawFile}`);

				this.client.on(rawFile.slice(0, -3), (...event) => {
					file.run(this.client, ...event);
				});
				i++;
			}
		}

		console.log(`${i} events loaded.`);
	}
}