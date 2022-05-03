import { GuildBan, Message } from 'discord.js';
import { fetchAllMessages } from '@utils/fetchAllMessages';
import Ryneczek from '@classes/Client';
import { Channel } from 'types/Config';

export default {
	name: 'guildBanAdd',
	async run(client: Ryneczek, member: GuildBan) {
		const channelsToCheck: Channel[] = client.config.channels.filter(channel => channel.clear);

		for(const channel of channelsToCheck) {
			const channelMessages = await fetchAllMessages(channel);

			const userMessages: Message[] = channelMessages.filter((m: Message) => m.author.id === member.user.id);

			for(const message of userMessages) {
				await message.delete().catch(() => null);
			}
		}
	},
};