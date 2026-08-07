import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ContainerBuilder,
	MessageFlags,
	PermissionFlagsBits,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
	SlashCommandBuilder,
} from "discord.js";
import Ryneczek from "#client";

const OPINIONS_PER_PAGE = 3;

export const data = {
	...new SlashCommandBuilder()
		.setName("opinions")
		.setDescription("Zarządzaj opiniami użytkowników.")
		.setContexts(0)
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("list")
				.setDescription("Wyświetla wszystkie opinie dla wybranego użytkownika.")
				.addUserOption((option) =>
					option
						.setName("user")
						.setDescription("Użytkownik, którego opinie chcesz wyświetlić")
						.setRequired(true),
				),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("remove")
				.setDescription("Usuwa opinię o podanym ID.")
				.addIntegerOption((option) =>
					option
						.setName("id")
						.setDescription("ID opinii do usunięcia")
						.setRequired(true)
						.setMinValue(1),
				),
		)
		.toJSON(),
};

function buildOpinionListPage(
	client: Ryneczek,
	opinions: {
		id: number;
		user: string;
		addedBy: string;
		positive: boolean;
		comment: string | null;
		approved: boolean;
		surveyResults: unknown;
	}[],
	userId: string,
	page: number,
	totalPages: number,
	totalCount: number,
) {
	const containers: (ContainerBuilder | ActionRowBuilder<ButtonBuilder>)[] = [];

	const headerContainer = new ContainerBuilder()
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`# Opinie użytkownika <@${userId}>\nŁącznie: **${totalCount}** · Strona **${page + 1}**/**${totalPages}**`,
			),
		);

	containers.push(headerContainer);

	for (const opinion of opinions) {
		const statusEmoji = opinion.approved ? "✅" : "⏳";
		const typeEmoji = opinion.positive ? "👍" : "👎";
		const statusText = opinion.approved ? "Zatwierdzona" : "Oczekuje";
		const typeText = opinion.positive ? "Pozytywna" : "Negatywna";
		const commentPreview = opinion.comment
			? opinion.comment.length > 100
				? `${opinion.comment.slice(0, 100)}...`
				: opinion.comment
			: "Brak komentarza";

		const opinionContainer = new ContainerBuilder()
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`### ${typeEmoji} Opinia #${opinion.id}`,
				),
			)
			.addSeparatorComponents(
				new SeparatorBuilder()
					.setSpacing(SeparatorSpacingSize.Small)
					.setDivider(true),
			)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`**Typ:** ${typeText}\n**Status:** ${statusEmoji} ${statusText}\n**Dodana przez:** <@${opinion.addedBy}>\n**Komentarz:** ${commentPreview}`,
				),
			);

		containers.push(opinionContainer);
	}

	if (totalPages > 1) {
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setLabel("◀ Poprzednia")
				.setStyle(ButtonStyle.Secondary)
				.setCustomId(`opinions_prev_${userId}_${page}`)
				.setDisabled(page === 0),
			new ButtonBuilder()
				.setLabel("Następna ▶")
				.setStyle(ButtonStyle.Secondary)
				.setCustomId(`opinions_next_${userId}_${page}`)
				.setDisabled(page >= totalPages - 1),
		);

		containers.push(row);
	}

	return containers;
}

export async function run(
	client: Ryneczek,
	interaction: ChatInputCommandInteraction,
) {
	switch (interaction.options.getSubcommand()) {
		case "list": {
			const user = interaction.options.getUser("user", true);

			const opinions = await client.prisma.opinions.findMany({
				where: {
					user: user.id,
				},
				orderBy: {
					id: "desc",
				},
			});

			if (!opinions.length) {
				return interaction.reply({
					content: "Brak opinii dla tego użytkownika.",
					flags: MessageFlags.Ephemeral,
				});
			}

			const totalPages = Math.ceil(opinions.length / OPINIONS_PER_PAGE);
			const page = 0;
			const pageOpinions = opinions.slice(
				page * OPINIONS_PER_PAGE,
				(page + 1) * OPINIONS_PER_PAGE,
			);

			const components = buildOpinionListPage(
				client,
				pageOpinions,
				user.id,
				page,
				totalPages,
				opinions.length,
			);

			const reply = await interaction.reply({
				components,
				flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
			});

			if (totalPages <= 1) {
				return;
			}

			const collector = reply.createMessageComponentCollector({
				time: client.ms("5m"),
			});

			collector.on("collect", async (btnInteraction) => {
				if (btnInteraction.user.id !== interaction.user.id) {
					return btnInteraction.reply({
						content: "To nie jest twoja interakcja!",
						flags: MessageFlags.Ephemeral,
					});
				}

				const parts = btnInteraction.customId.split("_");
				const direction = parts[1];
				const currentPage = Number(parts[3]);

				const newPage =
					direction === "next" ? currentPage + 1 : currentPage - 1;

				if (newPage < 0 || newPage >= totalPages) {
					return;
				}

				const newPageOpinions = opinions.slice(
					newPage * OPINIONS_PER_PAGE,
					(newPage + 1) * OPINIONS_PER_PAGE,
				);

				const newComponents = buildOpinionListPage(
					client,
					newPageOpinions,
					user.id,
					newPage,
					totalPages,
					opinions.length,
				);

				await btnInteraction.update({
					components: newComponents,
				});
			});

			collector.on("end", () => {
				interaction.editReply({
					components: buildOpinionListPage(
						client,
						opinions.slice(0, OPINIONS_PER_PAGE),
						user.id,
						0,
						totalPages,
						opinions.length,
					),
				}).catch(() => null);
			});

			break;
		}
		case "remove": {
			const opinionId = interaction.options.getInteger("id", true);

			const opinion = await client.prisma.opinions.findUnique({
				where: {
					id: opinionId,
				},
			});

			if (!opinion) {
				return interaction.reply({
					content: `Nie znaleziono opinii o ID **${opinionId}**.`,
					flags: MessageFlags.Ephemeral,
				});
			}

			await client.prisma.opinions.delete({
				where: {
					id: opinionId,
				},
			});

			if (opinion.messageId) {
				const channel = await client.channels
					.fetch(opinion.messageChannelId)
					.catch(() => null);

				if (channel && "messages" in channel) {
					await channel.messages.delete(opinion.messageId).catch(() => null);
				}

				return interaction.reply({
					content: `Pomyślnie usunięto opinię **#${opinionId}** (${opinion.positive ? "pozytywna" : "negatywna"} opinia o <@${opinion.user}>, dodana przez <@${opinion.addedBy}>). Wiadomość z opinią została również usunięta.`,
					flags: MessageFlags.Ephemeral,
				});
			}

			return interaction.reply({
				content: `Pomyślnie usunięto opinię **#${opinionId}** z bazy danych (${opinion.positive ? "pozytywna" : "negatywna"} opinia o <@${opinion.user}>, dodana przez <@${opinion.addedBy}>).\n⚠️ Wiadomość z opinią nie została automatycznie usunięta — usuń ją ręcznie z kanału opinii.`,
				flags: MessageFlags.Ephemeral,
			});
		}
		default: {
			return interaction.reply({
				content: "Nieznana podkomenda.",
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
