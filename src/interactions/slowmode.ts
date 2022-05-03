import { ButtonInteraction } from 'discord.js';
import Ryneczek from '@classes/Client';
import { readFileSync, writeFileSync } from 'fs';

export default {
	name: 'slowmode',
	run(client: Ryneczek, interaction: ButtonInteraction) {
		const userId = interaction.customId.split('_').at(-1);

		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		const slowmode = JSON.parse(readFileSync('./slowmode.json'));

		if(!slowmode[userId]) return interaction.update({ content: 'Użytkownik nie posiada slowmode na żadnym kanale!', embeds: [], components: [] });
		else delete slowmode[userId];

		writeFileSync('./slowmode.json', JSON.stringify(slowmode, null, 2));

		return interaction.update({ content: 'Zresetowałeś slowmode!', embeds: [], components: [] });
	},
};