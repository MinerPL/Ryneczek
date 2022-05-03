import { fetchAllMessages } from '@utils/fetchAllMessages';
import Ryneczek from '@classes/Client';
import { Message } from 'discord.js';
import { Channel } from 'types/Config';
import { readFileSync, writeFileSync } from 'fs';

export async function deleteOldMessages(client: Ryneczek, message: Message): Promise<void | Message> {
	const messages = await fetchAllMessages(message.channel);

	const userMessages: Message[] = messages.filter(m => m.author.id === message.author.id);

	const offertChannel: Channel = client.config.channels.find(ch => ch.id === message.channel.id);
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const slowmode = JSON.parse(readFileSync('./slowmode.json'));

	if(!slowmode[message.author.id]) slowmode[message.author.id] = {};
	if(!slowmode[message.author.id][message.channel.id]) slowmode[message.author.id][message.channel.id] = Date.now() + client.ms(offertChannel.slowmode);

	if(!(userMessages.at(-1).createdTimestamp < (Date.now() - client.ms(offertChannel.slowmode))) && slowmode[message.author.id][message.channel.id] < Date.now()) {
		return message.delete().catch(() => null);
	}

	if(userMessages.length < offertChannel.maxOfferts) return;

	slowmode[message.author.id][message.channel.id] = userMessages?.at(-1).createdTimestamp + client.ms(offertChannel.slowmode);

	const toDelete = userMessages.sort((a, b) => a.createdTimestamp - b.createdTimestamp).slice(0, userMessages.length - offertChannel.maxOfferts);

	for(const msg of toDelete) {
		await msg.delete();
	}

	writeFileSync('./slowmode.json', JSON.stringify(slowmode, null, 2));
}