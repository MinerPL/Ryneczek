import { suggestionCreate } from '@functions/suggestionCreate';
import { Message } from 'discord.js';
import Ryneczek from '@classes/Ryneczek';
import { Channel } from 'types/Config';
import { deleteOldMessages } from '@functions/deleteOldMessages';

export async function run(client: Ryneczek, message: Message) {
	if(message.author.bot) return;

	if(message.channel.id === client.config.suggestions) {
		await suggestionCreate(client, message);
	}

	const channels: Channel[] = Object.values(client.config.channels);

	if(channels.map(ch => ch.id).includes(message.channel.id)) {
		await deleteOldMessages(client, message);
	}

	if(channels.filter(x => x.autoPublish).map(ch => ch.id).includes(message.channel.id)) {
		await message.crosspost();
	}
}