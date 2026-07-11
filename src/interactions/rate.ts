import {
	ButtonInteraction,
	ContainerBuilder,
	GuildTextBasedChannel,
	LabelBuilder,
	MessageFlags,
	ModalBuilder,
	RadioGroupBuilder,
	RadioGroupOptionBuilder,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	TextDisplayBuilder,
	TextInputBuilder,
	ThreadAutoArchiveDuration,
	ThreadChannel,
	ThumbnailBuilder,
	User,
} from "discord.js";
import Ryneczek from "#client";

const surveyMapping = {
	fast: "Transakcja była szybka",
	good_contact: "Świetny i bezproblemowy kontakt",
	good_price: "Atrakcyjny przelicznik",
	as_described: "Wszystko zgodnie z ustaleniami",
	helpful_seller: "Sprzedawca był bardzo pomocny",
	suspicious_seller: "Sprzedawca zachowywał się podejrzanie",
	long_wait: "Długi czas oczekiwania",
	changed_mind: "Próba zmiany ustaleń w trakcie",
	wrong_amount: "Kwota niezgodna z umową",
	rude_seller: "Nieprzyjemne zachowanie sprzedawcy",
};

export async function run(client: Ryneczek, interaction: ButtonInteraction) {
	const [_, saleId] = interaction.customId.split("_");

	const sale = await client.prisma.sales.findUnique({
		where: {
			id: Number(saleId),
		},
		include: {
			offert: true,
		},
	});

	if (!sale) {
		return interaction.reply({
			content: "Nie znaleziono oferty!",
			flags: MessageFlags.Ephemeral,
		});
	}

	const currentOpinions = await client.prisma.opinions.findMany({
		where: {
			addedBy: interaction.user.id,
			saleId: sale.id,
		},
	});

	if (currentOpinions.length) {
		return interaction.reply({
			content: "Już wystawiłeś opinię do tego zakupu!",
			flags: MessageFlags.Ephemeral,
		});
	}

	const currentDate = new Date();

	const modalBuilder = new ModalBuilder()
		.setTitle("Opinia dotycząca zakupu!")
		.setCustomId(`opinion_comment_${currentDate.getTime()}`)
		.addLabelComponents(
			new LabelBuilder()
				.setLabel("Twoja opinia na temat sprzedawcy")
				.setRadioGroupComponent(
					new RadioGroupBuilder()
						.setCustomId("opinion_radio")
						.setRequired(true)
						.addOptions(
							new RadioGroupOptionBuilder()
								.setLabel("Pozytywna")
								.setDescription(
									"Sprzedawca był uczciwy i transakcja przebiegła pomyślnie.",
								)
								.setValue("positive"),
						)
						.addOptions(
							new RadioGroupOptionBuilder()
								.setLabel("Negatywna")
								.setDescription(
									"Sprzedawca nie był uczciwy lub transakcja zakończyła się niepowodzeniem.",
								)
								.setValue("negative"),
						),
				),
		)
		.addLabelComponents(
			new LabelBuilder()
				.setLabel("Wybierz szczegóły tej transakcji")
				.setStringSelectMenuComponent(
					new StringSelectMenuBuilder()
						.setCustomId("benefits")
						.setMaxValues(10)
						.setMinValues(0)
						.setRequired(false)
						.addOptions(
							// --- TWOJA OPCJA ---
							new StringSelectMenuOptionBuilder()
								.setLabel("Transakcja była szybka.")
								.setValue("fast"),
							new StringSelectMenuOptionBuilder()
								.setLabel("Świetny i bezproblemowy kontakt.")
								.setValue("good_contact"),
							new StringSelectMenuOptionBuilder()
								.setLabel("Atrakcyjny przelicznik.")
								.setValue("good_price"),
							new StringSelectMenuOptionBuilder()
								.setLabel("Wszystko zgodnie z ustaleniami.")
								.setValue("as_described"),
							new StringSelectMenuOptionBuilder()
								.setLabel("Sprzedawca był bardzo pomocny.")
								.setValue("helpful_seller"),

							// --- NEGATYWY ---
							new StringSelectMenuOptionBuilder()
								.setLabel("Sprzedawca zachowywał się podejrzanie.")
								.setValue("suspicious_seller"),
							new StringSelectMenuOptionBuilder()
								.setLabel("Długi czas oczekiwania.")
								.setValue("long_wait"),
							new StringSelectMenuOptionBuilder()
								.setLabel("Próba zmiany ustaleń w trakcie.")
								.setValue("changed_mind"),
							new StringSelectMenuOptionBuilder()
								.setLabel("Kwota niezgodna z umową.")
								.setValue("wrong_amount"),
							new StringSelectMenuOptionBuilder()
								.setLabel("Nieprzyjemne zachowanie sprzedawcy.")
								.setValue("rude_seller"),
						),
				),
		)
		.addLabelComponents(
			new LabelBuilder()
				.setLabel("Dodatkowy publiczny komentarz")
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId("comment")
						.setStyle(2)
						.setMaxLength(1000)
						.setRequired(false),
				),
		)
		.toJSON();

	const modal = await client.useModal(
		interaction,
		modalBuilder,
		client.ms("5m"),
	);

	if (!modal) {
		if (interaction.replied) {
			return;
		}
		return interaction
			.reply({
				content: "Nie udało się odczytać modala!",
				flags: MessageFlags.Ephemeral,
			})
			.catch(() => null);
	}

	const surveyResults = modal.fields.getStringSelectValues("benefits");

	const isPositive =
		modal.fields.getRadioGroup("opinion_radio").valueOf() === "positive";
	const comment = modal.fields.getTextInputValue("comment");

	await client.prisma.opinions.create({
		data: {
			user: sale.offert.userId,
			addedBy: interaction.user.id,
			positive: isPositive,
			comment: comment,
			saleId: sale.id,
			surveyResults: surveyResults,
		},
	});

	const container = new ContainerBuilder()
		.addSectionComponents(
			new SectionBuilder()
				.setThumbnailAccessory(
					new ThumbnailBuilder().setURL(
						client.users.cache.get(sale.offert.userId)?.displayAvatarURL() ??
							"https://cdn.discordapp.com/embed/avatars/0.png",
					),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`Nowa ${isPositive ? "pozytywna" : "negatywna"} opinia o <@${sale.offert.userId}>`,
					),
				),
		)
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		)
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`## Ankieta
${surveyResults.map((result) => `* ${surveyMapping[result]}`).join("\n")}`),
		)
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		)
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`## Dodatkowy komentarz
\`\`\`
${comment || "Brak"}
\`\`\``),
		);
	const opinionChannel = client.channels.cache.get(
		client.config.public_opinion_channel,
	);

	if (opinionChannel) {
		if ("send" in opinionChannel) {
			await opinionChannel.send({
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
		} else if (opinionChannel.isThreadOnly()) {
			const opinionThread = await client.prisma.profile.findFirst({
				where: {
					userId: sale.offert.userId,
				},
			});

			let userOpinionThread: ThreadChannel | null =
				await opinionChannel.threads.fetch(opinionThread?.opinionThread);

			if (!opinionThread?.opinionThread || !userOpinionThread?.id) {
				const seller: User | null = await client.users
					.fetch(sale.offert.userId)
					.catch(() => null);
				userOpinionThread = await opinionChannel.threads.create({
					name: `Opinie użytkownika ${seller?.username || sale.offert.userId}`,
					autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
					reason: "Tworzenie nowego wątku dla opinii użytkownika",
					message: {
						content: `Opinie o użytkowniku <@${sale.offert.userId}>`,
					},
				});

				await client.prisma.profile.upsert({
					where: {
						userId: sale.offert.userId,
					},
					update: {
						opinionThread: userOpinionThread.id,
					},
					create: {
						userId: sale.offert.userId,
						opinionThread: userOpinionThread.id,
					},
				});
			} else {
				await userOpinionThread.setArchived(false).catch(() => null);
				await userOpinionThread.setLocked(false).catch(() => null);
			}

			await userOpinionThread.send({
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
		}
	}

	await modal.reply({
		content: "Dziękujemy za twoją opinię jest ona dla nas bardzo ważna!",
	});
}
