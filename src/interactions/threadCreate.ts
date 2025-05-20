import { APIActionRowComponent } from "discord-api-types/v10";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonComponent,
	ButtonInteraction,
	ForumChannel,
	ThreadChannel,
} from "discord.js";
import Ryneczek from "#client";

export async function run(_client: Ryneczek, interaction: ButtonInteraction) {
	if (
		(interaction.channel as ThreadChannel).ownerId !== interaction.user.id &&
		!interaction.memberPermissions.has("ManageChannels")
	) {
		return interaction.reply({
			content: "Nie jesteś właścicielem tego wątku!",
			flags: 64,
		});
	}

	const action = interaction.customId.split("_")[1];
	const thread = interaction.channel as ThreadChannel;
	const soldTag = (
		thread.guild.channels.cache.get(thread.parentId) as ForumChannel
	).availableTags.find((tag) => tag.name === "Sprzedane");

	const newComponents: ActionRowBuilder = ActionRowBuilder.from(
		// @ts-expect-error
		interaction.message.components[0],
	);
	newComponents.components.forEach((x) =>
		(x as ButtonBuilder).setDisabled(true),
	);

	await interaction.message.edit({
		content: "Menu zarządzania wątkiem.",
		// @ts-expect-error
		components: [newComponents],
	});

	if (action === "sold") {
		await interaction.reply({
			content: "Oferta została oznaczona jako sprzedana.",
		});
		await thread.edit({
			archived: true,
			locked: true,
			appliedTags: [...thread.appliedTags, soldTag.id],
		});
	} else if (action === "close") {
		await interaction.reply({
			content: "Wątek został zamknięty oraz zablokowany.",
		});
		await thread.edit({ archived: true, locked: true });
	}
}
