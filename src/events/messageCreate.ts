import { suggestionCreate } from '@functions/suggestionCreate';
import { ChannelType, Message } from 'discord.js';
import Ryneczek from '@classes/Ryneczek';
import { Channel } from 'types/Config';

export async function run(client: Ryneczek, message: Message) {
	if(message.author.bot || message.channel.type === ChannelType.DM) return;

	if(message.channel.id === client.config.suggestions) {
		await suggestionCreate(client, message);
	}

	const channels: Channel[] = Object.values(client.config.channels);

	if(channels.filter(x => x.autoPublish).map(ch => ch.id).includes(message.channel.id)) {
		if(message.channel.type !== ChannelType.GuildNews) return;
		await message.crosspost().catch(() => null);
	}
}