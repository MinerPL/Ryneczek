import Ryneczek from '@classes/Ryneczek';
import { BaseGuildTextChannel, EmbedBuilder, Message } from 'discord.js';

export async function run(client: Ryneczek, message: Message) {
	const channel = message.guild.channels.cache.get(client.config.logs) as BaseGuildTextChannel;
	if(!channel) return;

	const embed = new EmbedBuilder()
		.setTitle('ℹ️ Wiadomość usunięta')
		.setAuthor({
			name: `${message.author.tag} (${message.author.id})`,
			iconURL: message.author.displayAvatarURL() || message.author.defaultAvatarURL,
		})
		.addFields([
			{
				name: 'ID Wiadomości',
				value: String(message.id),
				inline: true,
			},
			{
				name: 'Kanał',
				value: `<#${message.channel.id}> (${message.channel.id})`,
				inline: true,
			},
			{
				name: 'Treść wiadomości',
				value: message.content || 'Brak treści',
				inline: false,
			},
		])
		.setColor('#af1d1d')
		.setTimestamp();

	return channel.send({ embeds: [embed] });
}