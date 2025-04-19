import Ryneczek from "#client";
import { fetchAllMessages } from "#utils/fetchAllMessages";
import { GuildBan, Message } from "discord.js";
import { Channel } from "types/Config";

export async function run(client: Ryneczek, member: GuildBan) {
	const channelsToCheck: Channel[] = client.config.channels.filter(
		(channel) => channel.clear,
	);

	for (const channel of channelsToCheck) {
		const channelMessages = await fetchAllMessages(
			client.channels.cache.get(channel.id),
		);

		const userMessages: Message[] = channelMessages.filter(
			(m: Message) => m.author.id === member.user.id,
		);

		for (const message of userMessages) {
			await message.delete().catch(() => null);
		}
	}
}
