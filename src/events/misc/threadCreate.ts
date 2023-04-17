import Ryneczek from '@classes/Ryneczek';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ThreadChannel } from 'discord.js';

export async function run(client: Ryneczek, thread: ThreadChannel) {
	const buttons = new ActionRowBuilder<ButtonBuilder>()
		.addComponents(
			new ButtonBuilder()
				.setLabel('Oznacz jako sprzedane')
				.setStyle(ButtonStyle.Secondary)
				.setCustomId('threadCreate_selled'),
			new ButtonBuilder()
				.setLabel('Zamknij wątek')
				.setStyle(ButtonStyle.Danger)
				.setCustomId('threadCreate_close'),
		);

	thread.send({
		content: 'Menu zarządzania wątkiem.',
		components: [buttons],
	});
}
