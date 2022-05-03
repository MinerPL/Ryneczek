import Ryneczek from '@classes/Client';
import { readdirSync } from 'fs';

export default class EventHandler {
	client: Ryneczek;
	constructor(client: Ryneczek) {
		this.client = client;
	}

	async loadEvents() {
		const files = readdirSync(`${__dirname}/../../events`);

		for (const rawFile of files) {
			const file = (await import(`${__dirname}/../../events/${rawFile}`)).default;

			this.client.on(file.name, (...event) => {
				file.run(this.client, ...event);
			});
		}

		console.log(`${files.length} events loaded.`);
	}
}