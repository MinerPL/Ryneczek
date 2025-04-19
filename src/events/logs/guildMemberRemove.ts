import Ryneczek from "@classes/Ryneczek";
import { BaseGuildTextChannel, EmbedBuilder, GuildMember } from "discord.js";

export async function run(client: Ryneczek, member: GuildMember) {
	const channel = member.guild.channels.cache.get(
		client.config.logs,
	) as BaseGuildTextChannel;
	if (!channel) {
		return;
	}

	const embed = new EmbedBuilder()
		.setTitle("ℹ️ Użytkownik wyszedł")
		.setAuthor({
			name: `${member.user.tag} (${member.id})`,
			iconURL: member.user.displayAvatarURL() || member.user.defaultAvatarURL,
		})
		.setColor("#c66e1d")
		.setTimestamp();

	return channel.send({ embeds: [embed] });
}
