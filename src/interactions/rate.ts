import {
	ButtonInteraction,
	LabelBuilder,
	MessageFlags,
	ModalBuilder,
	RadioGroupBuilder,
	RadioGroupOptionBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	TextInputBuilder,
} from "discord.js";
import Ryneczek from "#client";
import { sendOpinionToConfiguredChannel } from "#utils/opinionDelivery";

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

	await sendOpinionToConfiguredChannel(client, {
		user: sale.offert.userId,
		positive: isPositive,
		comment,
		surveyResults,
	});

	await modal.reply({
		content: "Dziękujemy za twoją opinię jest ona dla nas bardzo ważna!",
	});
}
