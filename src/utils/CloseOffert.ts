import { Channel, ForumChannel } from "discord.js";
import Ryneczek from "#client";

export async function CloseOffert(client: Ryneczek, channel: Channel, db) {
	if (channel.isThread()) {
		await channel.setAppliedTags([
			(channel.parent as ForumChannel).availableTags.find(
				(tag) => tag.name?.toLowerCase() === "sprzedane",
			).id,
		]);

		await channel.setLocked(true);
		await channel.delete();
	}

	return client.prisma.offerts.update({
		where: {
			id: db.id,
		},
		data: {
			sold: true,
		},
	});
}
