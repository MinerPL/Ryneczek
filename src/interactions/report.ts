import {
	ButtonInteraction,
	EmbedBuilder,
	ForumChannel,
	ForumThreadChannel,
	GuildMemberRoleManager,
} from "discord.js";
import Ryneczek from "#client";

export async function run(client: Ryneczek, interaction: ButtonInteraction) {
	if (
		!(interaction.member.roles as GuildMemberRoleManager).cache.get(
			client.config.admin_role,
		)
	) {
		return interaction.reply({
			content: "Nie możesz zarządzaj zgłoszeniami!",
			flags: 64,
		});
	}

	const action = interaction.customId.split("_")[1];

	if (!["accept", "reject"].includes(action)) {
		return;
	}

	const embed = EmbedBuilder.from(interaction.message.embeds[0]);

	if (action === "accept") {
		interaction.channel.send({
			content: `Zakceptowane przez: <@${interaction.user.id}> (${interaction.user.username})`,
		})
		await interaction.reply({
			content:
				"Zgłoszenie zostało zaakceptowane! W celu ukarania użytkownika użyj `ban` znajdującego się w context menu (PPM na użytkownika).",
			flags: 64,
		});

		if(interaction.channel.parent instanceof ForumChannel) {
			const acceptTag = interaction.channel.parent.availableTags.find(tag => tag.emoji.name === "✅");
			if(acceptTag) {
				await (interaction.channel as ForumThreadChannel).edit({
					appliedTags: [acceptTag.id],
				});
			}
		}
	} else {
		interaction.channel.send({
			content: `Odrzucone przez: <@${interaction.user.id}> (${interaction.user.username})`,
		});
		if(interaction.channel.parent instanceof ForumChannel) {
			const rejectTag = interaction.channel.parent.availableTags.find(tag => tag.emoji.name === "❌");
			if(rejectTag) {
				await (interaction.channel as ForumThreadChannel).edit({
					appliedTags: [rejectTag.id],
				});
			}
		}
		await interaction.deferUpdate();
	}
}
