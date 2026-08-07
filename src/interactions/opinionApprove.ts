import {
	ButtonInteraction,
	GuildMemberRoleManager,
	MessageFlags,
} from "discord.js";
import Ryneczek from "#client";
import { sendOpinionToConfiguredChannel } from "#utils/opinionDelivery";

export async function run(client: Ryneczek, interaction: ButtonInteraction) {
	if (
		!(interaction.member.roles as GuildMemberRoleManager).cache.has(
			client.config.admin_role,
		)
	) {
		return interaction.reply({
			content: "Nie masz uprawnień do zatwierdzania opinii!",
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
			content: "Ta opinia została już zatwierdzona!",
			flags: MessageFlags.Ephemeral,
		});
	}

	await client.prisma.opinions.update({
		where: {
			id: opinion.id,
		},
		data: {
			approved: true,
		},
	});

	const result = await sendOpinionToConfiguredChannel(client, {
		user: opinion.user,
		addedBy: opinion.addedBy,
		positive: opinion.positive,
		comment: opinion.comment,
		surveyResults: opinion.surveyResults,
	});

	if (result) {
		await client.prisma.opinions.update({
			where: {
				id: opinion.id,
			},
			data: {
				messageId: result.messageId,
				messageChannelId: result.channelId,
			},
		});
	}

	await interaction.message.delete().catch(() => null);

	await interaction.reply({
		content: `Opinia #${opinion.id} została zatwierdzona i opublikowana przez <@${interaction.user.id}>.`,
		flags: MessageFlags.Ephemeral,
	});
}
