import { Message } from 'discord.js';

export async function fetchAllMessages(channel): Promise<Message[]> {
	let messages: Message[] = [];
	let lastID: string | undefined;

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const fetchedMessages = await channel.messages.fetch({
			limit: 100,
			...(lastID && { before: lastID }),
		});

		if (fetchedMessages.size === 0) {
			lastID = null;
			return messages;
		}

		messages = messages.concat(Array.from(fetchedMessages.values()));
		lastID = fetchedMessages.lastKey();
	}
}