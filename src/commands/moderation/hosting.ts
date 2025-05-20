import {
	ChatInputCommandInteraction,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandSubcommandBuilder,
} from "discord.js";
import Ryneczek from "#client";

export const data = {
	...new SlashCommandBuilder()
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName("add")
				.setDescription("Dodaje nowy hosting do bazy danych.")
				.addStringOption((option) =>
					option
						.setName("name")
						.setDescription("Nazwa hostingu")
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName("page")
						.setDescription("Strona hostingu")
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName("emoji_id")
						.setDescription("ID Emotki z logiem hostingu")
						.setRequired(true),
				),
		)
		.addSubcommand(
			new SlashCommandSubcommandBuilder()
				.setName("remove")
				.setDescription("Usuwa hosting z bazy danych.")
				.addStringOption((option) =>
					option
						.setName("name")
						.setDescription("Nazwa hostingu")
						.setRequired(true)
						.setAutocomplete(true),
				),
		)
		.setName("hosting")
		.setDescription(
			"Pozwala dodawać oraz usuwać hostingi z możliwych do wyboru.",
		)
		.setContexts(0)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.toJSON(),
};

export async function run(
	client: Ryneczek,
	interaction: ChatInputCommandInteraction,
) {
	const action = interaction.options.getSubcommand().toLowerCase();

	if (action === "add") {
		const name = interaction.options.getString("name");
		const page = interaction.options.getString("page");
		const emoji_id = interaction.options.getString("emoji_id");

		if (!name || !page || !emoji_id) {
			return interaction.reply({
				content: "Nie podano wszystkich wymaganych argumentów!",
				flags: 64,
			});
		}

		// Replace all special characters with an empty string
		const hosting_id = name
			.toLowerCase()
			.replace(/[^a-z0-9]/g, "")
			.replace(/\s+/g, "");

		const hosting = await client.prisma.hostings
			.create({
				data: {
					name,
					website: page,
					emoji: emoji_id,
					hosting_id: hosting_id,
					icon: `https://minerpl.xyz/ryneczek/${hosting_id}.png`,
				},
			})
			.catch(() => null);

		if (!hosting) {
			return interaction.reply({
				content: "Nie udało się dodać hostingu!",
				flags: 64,
			});
		}

		return interaction.reply({
			content: `Dodano hosting \`${hosting.name}\`!`,
		});
	} else if (action === "remove") {
		const hosting = interaction.options.getString("name");

		if (!hosting) {
			return interaction.reply({
				content: "Nie podano hostingu!",
				flags: 64,
			});
		}

		const dbHosting = await client.prisma.hostings.findFirst({
			where: {
				hosting_id: hosting,
			},
		});

		if (!dbHosting) {
			return interaction.reply({
				content: "Nie znaleziono hostingu!",
				flags: 64,
			});
		}

		await client.prisma.hostings.delete({
			where: {
				id: dbHosting.id,
			},
		});

		return interaction.reply({
			content: `Usunięto hosting \`${dbHosting.name}\`!`,
		});
	}
}
