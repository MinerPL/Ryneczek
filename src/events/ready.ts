import Ryneczek from '@classes/Ryneczek';
import { ActivityType, Routes } from 'discord-api-types/v10';
import { REST } from '@discordjs/rest';

export async function run(client: Ryneczek) {
	console.log(`${client.user.tag} is ready!`);

	client.user.setActivity('rynek', {
		type: ActivityType.Watching,
	});

	if(process.argv.includes('--deploy')) {
		const rest = new REST({ version: '10' }).setToken(client.config.token);

		await rest.put(
			Routes.applicationGuildCommands(client.user.id, '811550188823904277'),

			{ body: [...client.commands.map(x => x.data), ...client.commands.filter(x => x.data.context).map(x => x.data.context)] },
		);

		console.log('Pomyslnie zaktualizowano slashcommands!');
	}
}