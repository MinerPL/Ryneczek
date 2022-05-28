import Ryneczek from '@classes/Ryneczek';
import { ActivityType } from 'discord-api-types/v10';
import { schedule } from 'node-cron';
import { Channel } from 'types/Config';
import { deleteOldOffert } from '@functions/deleteOldOffert';
import { clearFile } from '@utils/clearFile';
import { readFileSync, writeFileSync } from 'fs';

export default {
	name: 'ready',
	run(client: Ryneczek) {
		console.log(`${client.user.tag} is ready!`);

		client.user.setActivity('rynek', {
			type: ActivityType.Watching,
		});

		schedule('01 00 00 * * *', () => {
			const channelsArray: Channel[] = client.config.channels.filter(ch => ch.deletionTime);

			for(const channel of channelsArray) {
				deleteOldOffert(client.channels.cache.get(channel.id), client.ms(channel.deletionTime)).then(() => null);
			}

			writeFileSync('./slowmode.json', JSON.stringify(clearFile(JSON.parse(readFileSync('./slowmode.json', 'utf-8'))), null, 2));
		});
	},
};