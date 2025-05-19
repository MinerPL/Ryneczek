import Ryneczek from "#client";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ThreadChannel,
} from "discord.js";

const buttonsManager = (thread: ThreadChannel) => {
	const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setLabel("Oznacz jako sprzedane")
			.setStyle(ButtonStyle.Secondary)
			.setCustomId("threadCreate_sold"),
		new ButtonBuilder()
			.setLabel("Zamknij wątek")
			.setStyle(ButtonStyle.Danger)
			.setCustomId("threadCreate_close"),
	);

	return thread.send({
		content: "Menu zarządzania wątkiem.",
		components: [buttons],
	});
};

export async function run(client: Ryneczek, thread: ThreadChannel) {
	if (thread.parent.parentId !== client.config.offerts_category) {
		return;
	}
	await buttonsManager(thread);
}
