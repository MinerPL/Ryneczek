import { fetchAllMessages } from "@utils/fetchAllMessages";
import { Channel, Message } from "discord.js";

export async function deleteOldOffert(
	channel: Channel,
	slowmode: number,
): Promise<void> {
	const messages = await fetchAllMessages(channel);
	const messagesToDelete: Message[] = messages.filter(
		(m: Message) => m.createdTimestamp < Date.now() - slowmode,
	);

	for (const message of messagesToDelete) {
		await message.delete().catch(() => null);
	}
}
