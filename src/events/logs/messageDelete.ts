import Ryneczek from '@classes/Ryneczek';
import { AttachmentBuilder, BaseGuildTextChannel, EmbedBuilder, Message } from 'discord.js';

export async function run(client: Ryneczek, message: Message) {
	const channel = message.guild.channels.cache.get(client.config.logs) as BaseGuildTextChannel;
	if(!channel) return;

	const attachments = [];
	const embeds = [];

	const embed = new EmbedBuilder()
		.setURL('https://discord.gg/' + await message.guild.invites.fetch().then(invites => invites.first().code))
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

	let i = 0;
	for(const attachment of message.attachments.values()) {
		// @ts-expect-error
		const newAttachment = new AttachmentBuilder(attachment.attachment, {
			name: `${attachment.name.split('.')[0]}.${i}.${attachment.name.split('.')[1]}`,
			description: attachment.description,
		});

		const tempEmbed = EmbedBuilder.from(embed.toJSON());
		tempEmbed.setImage('attachment://' + `${attachment.name.split('.')[0]}.${i}.${attachment.name.split('.')[1]}`);

		attachments.push(newAttachment);
		embeds.push(tempEmbed);

		i++;
	}

	if(!embeds.length) embeds.push(embed);

	return channel.send({ embeds: embeds, files: attachments });
}