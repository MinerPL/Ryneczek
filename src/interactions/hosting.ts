import {
	ActionRowBuilder,
	AnySelectMenuInteraction,
	AutocompleteInteraction,
	ForumThreadChannel,
	GuildChannel,
	GuildTextBasedChannel,
	Message,
	MessageFlags,
	ModalActionRowComponentBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import Ryneczek from "#client";
import { OfferContainer } from "#utils/OfferContainer";

export async function run(
	client: Ryneczek,
	interaction: AutocompleteInteraction,
) {
	const hostings = await client.prisma.hostings.findMany();

	if (!hostings.length) {
		return interaction.respond([
			{
				name: "Nie znaleziono hostingu!",
				value: "none",
			},
		]);
	}

	const formattedHostings = hostings.map((hosting) => ({
		name: hosting.name + " (" + (hosting?.website || "brak") + ")",
		value: hosting.hosting_id,
	}));

	const filtered = formattedHostings.filter((hosting) =>
		hosting.name.toLowerCase().includes(interaction.options.getString("name")),
	);

	if (filtered.length > 25) {
		return interaction.respond(filtered.slice(0, 25));
	}

	return interaction.respond(filtered);
}
