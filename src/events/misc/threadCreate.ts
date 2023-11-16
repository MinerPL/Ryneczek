import Ryneczek from '@classes/Ryneczek';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ForumChannel, ThreadChannel } from 'discord.js';
import { readFile, writeFile } from 'node:fs/promises';
import { ForumJson } from '../../types/Forum';

const buttonsManager = (thread: ThreadChannel) => {

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
};

const forumIntegration = async (client: Ryneczek, thread: ThreadChannel) => {
	const forumChannel: ForumChannel | undefined = thread.guild.channels.cache.get(thread.parentId) as ForumChannel;

	if(forumChannel.parentId !== client.config.offerts_category) return;

	if(!forumChannel) return;

	if(forumChannel.id == client.config.hostgier_resend) return;

	if(forumChannel.availableTags.find(tag => tag.id === '1009540921991385199') && !thread.appliedTags.includes('1009540921991385199')) return;

	let content = (await thread.fetchStarterMessage()).content;
	content += '\n\n';
	content += `Oferta została wysłana na [Ryneczku](https://discord.gg/Ex4qDHHyXR) na [kanale ${forumChannel.name}](https://discord.com/channels/${thread.guildId}/${thread.id})`;

	const item = await client.hostgier.createDiscussion({
		data: {
			type: 'discussions',
			attributes: {
				title: thread.name,
				content: content,
			},
			relationships: {
				tags: {
					data: [
						{
							type: 'tags',
							id: client.hostgier.tags.find(tag => tag.attributes.name === 'Ryneczek').id,
						},
					],
				},
			},
		},
	});

	if(item) {
		const forumJson: ForumJson[] = JSON.parse(await readFile('./forum.json', 'utf-8'));

		forumJson.push({
			discord: thread.id,
			forum: item.data.id,
		});

		await writeFile('./forum.json', JSON.stringify(forumJson), 'utf-8');
	}
};

export async function run(client: Ryneczek, thread: ThreadChannel) {
	if(thread.parentId == client.config.hostgier_resend) return;

	buttonsManager(thread);
	await forumIntegration(client, thread);
}
