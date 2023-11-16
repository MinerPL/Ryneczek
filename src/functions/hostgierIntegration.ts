import { ForumChannel, Message, ThreadChannel } from 'discord.js';
import Ryneczek from '@classes/Ryneczek';
import { Discussion } from '../types/Flarum';
import { ForumJson } from '../types/Forum';
import { readFile, writeFile } from 'node:fs/promises';

export async function hostgierIntegration(client: Ryneczek, message: Message) {
	if(!message.embeds.at(0)) return;

	const embed = message.embeds.at(0);

	if(embed.author.name === 'Ryneczek') return;

	const title = embed.title;
	const url = embed.url;
	const id = url.match(/https:\/\/forum\.hostgier\.pl\/d\/(\w+)(\/\w+|-.*|)/)?.at(1);

	if(!id) return;

	const forumPost = await client.hostgier.getDiscussion(id);

	if('errors' in forumPost) return;

	if (title.startsWith('Rozpoczęto dyskusję')) {
		await createThread(client, message, forumPost);
	}
	else if (title.startsWith('Nowy post w')) {
		await writePost(client, message, forumPost);
	}
}

const createThread = async (client: Ryneczek, message: Message, post: Discussion) => {
	const resendChannel = message.guild?.channels.cache.get(client.config.hostgier_resend) as ForumChannel;

	if(!resendChannel) return;

	const thread = await resendChannel.threads.create({
		name: post.data.attributes.title,
		autoArchiveDuration: 1440,
		reason: 'Nowa dyskusja na forum',
		message: {
			embeds: [message.embeds.at(0)],
		},
	}).catch(() => null);

	if(!thread) return;

	const forumJson: ForumJson[] = JSON.parse(await readFile('./forum.json', 'utf-8'));

	forumJson.push({
		discord: thread.id,
		forum: post.data.id,
	});

	await writeFile('./forum.json', JSON.stringify(forumJson), 'utf-8');
};

const writePost = async (client: Ryneczek, message: Message, post: Discussion) => {
	const forumJson: ForumJson[] = JSON.parse(await readFile('./forum.json', 'utf-8'));

	const thread = message.guild?.channels.cache.get(forumJson.find(x => x.forum === post.data.id)?.discord) as ThreadChannel;

	if(!thread) return;

	const embed = message?.embeds.at(0);

	if(!embed) return;

	if(embed.author?.name === 'Ryneczek') return;

	await thread.send({
		embeds: [embed],
	});
};