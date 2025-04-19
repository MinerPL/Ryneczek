import Ryneczek from "@classes/Ryneczek";
import { BaseGuildTextChannel, EmbedBuilder, Message } from "discord.js";

export async function run(
	client: Ryneczek,
	oldMessage: Message,
	newMessage: Message,
) {
	if (oldMessage.content === newMessage.content) {
		return;
	}
	const channel = oldMessage.guild.channels.cache.get(
		client.config.logs,
	) as BaseGuildTextChannel;
	if (!channel) {
		return;
	}

	const embed = new EmbedBuilder()
		.setTitle("ℹ️ Wiadomość edytowana")
		.setAuthor({
			name: `${oldMessage.author.tag} (${oldMessage.author.id})`,
			iconURL:
				oldMessage.author.displayAvatarURL() ||
				oldMessage.author.defaultAvatarURL,
		})
		.addFields([
			{
				name: "ID Wiadomości",
				value: String(oldMessage.id),
				inline: true,
			},
			{
				name: "Kanał",
				value: `<#${oldMessage.channel.id}> (${oldMessage.channel.id})`,
				inline: true,
			},
			{
				name: "Stara treść wiadomości",
				value: oldMessage.content || "Brak treści",
				inline: false,
			},
			{
				name: "Nowa treść wiadomości",
				value: newMessage.content || "Brak treści",
				inline: false,
			},
		])
		.setColor("#771daf")
		.setTimestamp();

	return channel.send({ embeds: [embed] });
}
