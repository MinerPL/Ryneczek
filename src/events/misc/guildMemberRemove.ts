import { ForumChannel, GuildMember, TextChannel } from "discord.js";
import Ryneczek from "#client";
import { CloseOffert } from "#utils/CloseOffert";

export async function run(client: Ryneczek, member: GuildMember) {
	if (member.user.bot) {
		return;
	}
	const channels = member.guild.channels.cache.filter(
		(channel) => channel.parentId === client.config.offerts_category,
	);

	if (!channels.size) {
		return;
	}

	for (const channel of channels.values()) {
		if (channel instanceof ForumChannel) {
			for (const thread of channel.threads.cache
				.filter((x) => x.ownerId === member.id && !x.archived)
				.values()) {
				await thread.send({
					content:
						"Użytkownik opuścił serwer, wątek został zarchiwizowany oraz zablokowany.",
				});
				if (thread.parent.parentId === client.config.wpln_forum) {
					await thread.delete();
				} else {
					await thread.setLocked(true);
					await thread.setArchived(true);
				}
			}
		} else {
			const messages = await (channel as TextChannel).messages.fetch({
				limit: 100,
			});
			await (channel as TextChannel).bulkDelete(
				messages.filter((message) => message.author.id === member.id),
			);
		}
	}

	const userOfferts = await client.prisma.offerts.findMany({
		where: {
			userId: member.user.id,
		},
	});

	if (userOfferts.length) {
		for (const offert of userOfferts) {
			const channel = client.channels.cache.get(offert.channelId);
			await CloseOffert(client, channel, offert);
		}
	}
}
