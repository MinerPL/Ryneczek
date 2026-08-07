import {
	ButtonInteraction,
	GuildMemberRoleManager,
	MessageFlags,
} from "discord.js";
import Ryneczek from "#client";

export async function run(client: Ryneczek, interaction: ButtonInteraction) {
	if (
		!(interaction.member.roles as GuildMemberRoleManager).cache.has(
			client.config.admin_role,
		)
	) {
		return interaction.reply({
			content: "Nie masz uprawnień do odrzucania opinii!",
			flags: MessageFlags.Ephemeral,
		});
	}

	const [_, opinionId] = interaction.customId.split("_");

	const opinion = await client.prisma.opinions.findUnique({
		where: {
			id: Number(opinionId),
		},
	});

	if (!opinion) {
		return interaction.reply({
			content: "Nie znaleziono opinii w bazie danych!",
			flags: MessageFlags.Ephemeral,
		});
	}

	if (opinion.approved) {
		return interaction.reply({
			content: "Ta opinia została już zatwierdzona i nie można jej odrzucić!",
			flags: MessageFlags.Ephemeral,
		});
	}

	await client.prisma.opinions.delete({
		where: {
			id: opinion.id,
		},
	});

	await interaction.message.delete().catch(() => null);

	await interaction.reply({
		content: `Opinia #${opinion.id} została odrzucona przez <@${interaction.user.id}>.`,
		flags: MessageFlags.Ephemeral,
	});
}
