import {
	AnySelectMenuInteraction,
	ContainerBuilder,
	ForumThreadChannel,
	GuildChannel,
	GuildTextBasedChannel,
	Message,
	MessageFlags,
	LabelBuilder,
	ModalBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	TextDisplayBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import Ryneczek from "#client";
import { OfferContainer } from "#utils/OfferContainer";
import { showUserSummary } from "#utils/ShowUserSummary";

export async function run(
	client: Ryneczek,
	interaction: AnySelectMenuInteraction,
) {
	const hosting = interaction.values?.at(0);

	if (!hosting) {
		return interaction.reply({
			content: "Nie wybrano hostingu!",
			flags: MessageFlags.Ephemeral,
		});
	}

	const userOfferts = await client.prisma.offerts.findMany({
		where: {
			userId: interaction.user.id,
			sold: false,
		},
		include: {
			hosting: true,
		},
	});

	if (userOfferts.length) {
		return interaction.reply({
			content: `Masz już aktywne oferty na tym hostingu! Przed dodaniem nowej oferty oznacz pozostałe jako sprzedane.
Twoje pozostale oferty: ${userOfferts.map((o) => `<#${o.channelId}>`).join(", ")}`,
			flags: MessageFlags.Ephemeral,
		});
	}

	const currentDate = new Date();

	const modal = new ModalBuilder()
		.setTitle(`Oferta ${hosting}`)
		.setCustomId(`offer_${hosting}_${currentDate.getTime()}`)
		.addLabelComponents(
			new LabelBuilder()
				.setLabel("Ilość wPLN")
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId("count")
						.setPlaceholder("Ilość wPLN (np. 1000)")
						.setMaxLength(5)
						.setStyle(TextInputStyle.Short)
						.setRequired(true),
				),
			new LabelBuilder()
				.setLabel("Kurs")
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId("exchange")
						.setPlaceholder("Kurs sprzedaży wPLN (np. 2.00 lub 0.5)")
						.setStyle(TextInputStyle.Short)
						.setMaxLength(3)
						.setRequired(true),
				),
			new LabelBuilder()
				.setLabel("Metody płatności")
				.setStringSelectMenuComponent(
					new StringSelectMenuBuilder()
						.setCustomId("methods")
						.setRequired(true)
						.setMinValues(1)
						.setMaxValues(9)
						.addOptions(
							new StringSelectMenuOptionBuilder().setLabel("BLIK").setValue("BLIK"),
							new StringSelectMenuOptionBuilder().setLabel("PayPal").setValue("PayPal"),
							new StringSelectMenuOptionBuilder().setLabel("Paysafecard").setValue("Paysafecard"),
							new StringSelectMenuOptionBuilder().setLabel("Kryptowaluty").setValue("Kryptowaluty"),
							new StringSelectMenuOptionBuilder().setLabel("Przelew").setValue("Przelew"),
							new StringSelectMenuOptionBuilder().setLabel("Revolut").setValue("Revolut"),
							new StringSelectMenuOptionBuilder().setLabel("Skrill").setValue("Skrill"),
							new StringSelectMenuOptionBuilder().setLabel("Przedmioty Steam").setValue("Przedmioty Steam"),
							new StringSelectMenuOptionBuilder().setLabel("Tipply").setValue("Tipply"),
						),
				),
			new LabelBuilder()
				.setLabel("Dodatkowe informacje")
				.setTextInputComponent(
					new TextInputBuilder()
						.setCustomId("additional_information")
						.setPlaceholder("Dodatkowe informacje (np. Wymagania, inne)")
						.setStyle(TextInputStyle.Paragraph)
						.setRequired(false),
				),
		)
		.toJSON();

	const response = await client.useModal(interaction, modal, client.ms("5m"));

	if (!response) {
		if (interaction.replied) {
			return;
		}
		return interaction
			.reply({
				content: "Nie udało się odebrać formularza!",
				flags: MessageFlags.Ephemeral,
			})
			.catch(() => null);
	}

	const count = Number(response.fields.getTextInputValue("count"));
	const exchange = Number(response.fields.getTextInputValue("exchange"));

	if (isNaN(exchange) || isNaN(count) || exchange <= 0 || count <= 0) {
		return response.reply({
			content: "Kurs i ilość muszą być liczbami!",
			flags: MessageFlags.Ephemeral,
		});
	}

	let oldExchange: number;
	let newExchange: number;
	if (exchange < 1) {
		oldExchange = exchange;
		newExchange = Number((1 / exchange).toFixed(2));
	} else {
		newExchange = exchange;
		oldExchange = Number((1 / exchange).toFixed(2));
	}

	const dbHosting = await client.prisma.hostings.findFirst({
		where: {
			hosting_id: hosting,
		},
	});

	if (!dbHosting) {
		return response.reply({
			content: "Nie znaleziono hostingu!",
			flags: MessageFlags.Ephemeral,
		});
	}

	const susUser = await client.prisma.suspicions.findFirst({
		where: {
			userId: interaction.user.id,
		},
	});

	const container = OfferContainer({
		dbHosting: dbHosting,
		OfferDetails: {
			user: response.user,
			newExchange: newExchange,
			oldExchange: oldExchange,
			methods: response.fields.getStringSelectValues("methods").join(", "),
			count: count,
			additional_information: response.fields.getTextInputValue("additional_information"),
		},
	});
	const susUserContainer = new ContainerBuilder()
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`# Podejrzany sprzedawca\nUwaga, <@${susUser?.userId}> został oznaczony jako podejrzany sprzedawca. Dla bezpieczeństwa kupującego, wszelkie płatności powinny odbywać się za pośrednictwem middlemana.`,
			),
		)
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		)
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				"**Pamiętaj!** Usługa middlemana jest w pełni darmowa oraz jest realizowana przez administracje tego serwera na prywatnym kanale, zapewniając bezpieczeństwo dokonywanej transakcji.",
			),
		);

	const channel = client.channels.cache.get(
		client.config.wpln_forum,
	) as GuildChannel;

	let message: ForumThreadChannel | Message;
	const summaryContainer = await showUserSummary(client, interaction.user.id);
	if (channel.isThreadOnly()) {
		const tag = channel.availableTags.find(
			(t) => t.name?.toLowerCase() === dbHosting.name?.toLowerCase(),
		);

		message = await channel.threads
			.create({
				name: `Oferta ${response.user.username}`,
				autoArchiveDuration: 60,
				message: {
					components: [container, summaryContainer],
					flags: MessageFlags.IsComponentsV2,
				},
				appliedTags: tag ? [tag.id] : [],
			})
			.catch((e) => {
				console.log(e);
				return null;
			});
		if (message) {
			await (message as ForumThreadChannel).members.add(response.user.id);
			if (susUser) {
				await (message as ForumThreadChannel)
					.send({
						components: [susUserContainer],
						flags: MessageFlags.IsComponentsV2,
					})
					.catch((e) => {
						console.log(e);
					});
			}
		}
	} else {
		message = await (channel as GuildTextBasedChannel)
			.send({
				components: [container, summaryContainer],
				flags: MessageFlags.IsComponentsV2,
			})
			.catch((e) => {
				console.log(e);
				return null;
			});
		if (susUser) {
			await (channel as GuildTextBasedChannel)
				.send({
					components: [susUserContainer],
					flags: MessageFlags.IsComponentsV2,
				})
				.catch((e) => {
					console.log(e);
				});
		}
	}

	if (!message) {
		return response.reply({
			content: "Nie udało się wysłać wiadomości!",
			flags: MessageFlags.Ephemeral,
		});
	}

	const dbOffer = await client.prisma.offerts
		.create({
			data: {
				userId: response.user.id,
				messageId: message.id,
				channelId: channel.isThreadOnly() ? message.id : channel.id,
				hostingId: dbHosting.id,
				exchange: newExchange,
				count: count,
				paymentMethod: response.fields.getStringSelectValues("methods").join(", "),
				additionalInfo: response.fields.getTextInputValue("additional_information"),
				verifiedCount: false,
				sold: false,
			},
		})
		.catch((e) => {
			console.log(e);
			return null;
		});

	await interaction.message.edit({
		components: interaction.message.components,
		flags: MessageFlags.IsComponentsV2,
	});

	if (!dbOffer) {
		await message.delete().catch(() => null);
		return response
			.followUp({
				content: "Nie udało się dodać oferty do bazy danych!",
				flags: MessageFlags.Ephemeral,
			})
			.catch(() => null);
	}

	await response
		.reply({
			content: "Utworzono ofertę!",
			flags: MessageFlags.Ephemeral,
		})
		.catch(() => null);
}
