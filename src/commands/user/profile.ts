import {
	ChatInputCommandInteraction,
	ContainerBuilder,
	MessageFlags,
	SlashCommandBuilder,
	TextDisplayBuilder,
} from "discord.js";
import Ryneczek from "#client";
import { showUserSummary } from "#utils/ShowUserSummary";

export const data = {
	...new SlashCommandBuilder()
		.setName("profile")
		.setDescription("Wyświetla profil użytkownika")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("Wybierz użytkownika, którego profil chcesz wyświetlić")
				.setRequired(false),
		)
		.setContexts(0)
		.toJSON(),
};

export async function run(
	client: Ryneczek,
	interaction: ChatInputCommandInteraction,
) {
	const user = interaction.options.getUser("user");
	const summaryContainer = await showUserSummary(
		client,
		user?.id ?? interaction.user.id,
	);
	await interaction.reply({
		components: [summaryContainer],
		flags: MessageFlags.IsComponentsV2,
	});
}
