import {
	ActionRowBuilder,
	ButtonInteraction,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import Ryneczek from "#client";

export async function run(client: Ryneczek, interaction: ButtonInteraction) {
	const [_, opinionType, salesId] = interaction.customId.split("_");
	if (!["positive", "negative"].includes(opinionType)) {
		return;
	}
	const sale = await client.prisma.sales.findUnique({
		where: {
			id: Number(salesId),
		},
		include: {
			offert: true,
		},
	});

	if (!sale) {
		return interaction.reply({
			content: "Nie znaleziono oferty!",
			flags: 64,
		});
	}

	const currentOpinions = await client.prisma.opinions.findMany({
		where: {
			user:
				interaction.user.id === sale.offert.userId
					? sale.buyerId
					: sale.offert.userId,
			saleId: sale.id,
		},
	});

	if (currentOpinions.length) {
		return interaction.reply({
			content: "Już wystawiłeś opinię!",
			flags: 64,
		});
	}

	const modalBuilder = new ModalBuilder()
		.setTitle("Uzasadnij swoją opinię")
		.setCustomId("opinion2_comment")
		.addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setLabel("Uzasadnienie")
					.setCustomId("comment")
					.setPlaceholder("Uzasadnij swoją opinię")
					.setStyle(TextInputStyle.Paragraph)
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
		return interaction.reply({
			content: "Nie udało się odczytać modala!",
			flags: 64,
		});
	}

	const comment =
		modal.fields.getField("comment")?.value || "Brak uzasadnienia";

	const opinion = opinionType === "positive";

	await client.prisma.opinions.create({
		data: {
			user:
				interaction.user.id === sale.offert.userId
					? sale.buyerId
					: sale.offert.userId,
			positive: opinion,
			comment: comment,
			saleId: sale.id,
		},
	});

	await modal.reply({
		content: `Pomyślnie wystawiłeś ${opinion ? "pozytywną" : "negatywną"} opinię!`,
		flags: 64,
	});
}
