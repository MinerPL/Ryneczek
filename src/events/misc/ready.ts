import Ryneczek from '@classes/Ryneczek';
import { ActivityType, Routes } from 'discord-api-types/v10';

export async function run(client: Ryneczek) {
	console.log(`${client.user.tag} is ready!`);

	client.user.setActivity('rynek', {
		type: ActivityType.Watching,
	});

	console.log(`Successfully fetched ${await client.fetchMessages(client.guilds.cache.get('811550188823904277'))} messages.`);

	if(process.argv.includes('--deploy')) {
		await client.rest.put(
			Routes.applicationGuildCommands(client.user.id, '811550188823904277'),

			{ body: [...client.commands.map(x => x.data), ...client.commands.filter(x => x.data.context).map(x => x.data.context)] },
		);

		console.log('Pomyslnie zaktualizowano slashcommands!');
	}
}