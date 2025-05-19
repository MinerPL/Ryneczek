import { BaseGuildTextChannel, EmbedBuilder, GuildMember } from "discord.js";
import Ryneczek from "#client";

export async function run(client: Ryneczek, member: GuildMember) {
	const channel = member.guild.channels.cache.get(
		client.config.logs,
	) as BaseGuildTextChannel;
	if (!channel) {
		return;
	}

	const embed = new EmbedBuilder()
		.setTitle("ℹ️ Użytkownik dołączył")
		.setAuthor({
			name: `${member.user.tag} (${member.id})`,
			iconURL: member.user.displayAvatarURL() || member.user.defaultAvatarURL,
		})
		.addFields({
			name: "Konto utworzone",
			value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`,
		})
		.setColor("#1ad8bc")
		.setTimestamp();

	return channel.send({ embeds: [embed] });
}
