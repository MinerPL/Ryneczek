import {
	ChatInputCommandInteraction,
	GuildMember,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import Ryneczek from "#client";
import { sendOpinionToConfiguredChannel } from "#utils/opinionDelivery";

export const data = {
	...new SlashCommandBuilder()
		.setName("migrate-opinions")
		.setDescription("Ponownie wysyła wszystkie opinie zapisane w bazie danych.")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.setContexts(0)
		.toJSON(),
};

export async function run(
	client: Ryneczek,
	interaction: ChatInputCommandInteraction,
) {
	if (
		!(interaction.member as GuildMember).roles.cache.has(
			client.config.admin_role,
		)
	) {
		return interaction.reply({
			content: "Nie masz uprawnień do tej komendy!",
			flags: MessageFlags.Ephemeral,
		});
	}

	await interaction.deferReply({
		flags: MessageFlags.Ephemeral,
	});

	const opinions = await client.prisma.opinions.findMany({
		orderBy: {
			id: "asc",
		},
	});

	let sent = 0;
	let skipped = 0;
	let failed = 0;

	for (const opinion of opinions) {
		try {
			if (!client.users.cache.get(opinion.user)) {
				continue;
			}
			const delivered = await sendOpinionToConfiguredChannel(client, opinion);
			if (delivered) {
				sent++;
			} else {
				skipped++;
			}
		} catch (error) {
			failed++;
			console.error(
				`Nie udało się ponownie wysłać opinii ${opinion.id}.`,
				error,
			);
		}
	}

	await interaction.editReply({
		content: `Przesłano ${sent} opinii${skipped ? `, pominięto ${skipped}` : ""}${failed ? `, błędy ${failed}` : ""}.`,
	});
}
