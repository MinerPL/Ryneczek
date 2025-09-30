import {
	ActionRowBuilder,
	AnySelectMenuInteraction,
	ContainerBuilder,
	ForumThreadChannel,
	GuildChannel,
	GuildTextBasedChannel,
	Message,
	MessageFlags,
	ModalActionRowComponentBuilder,
	ModalBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import Ryneczek from "#client";
import { OfferContainer } from "#utils/OfferContainer";

export async function run(
	client: Ryneczek,
	interaction: AnySelectMenuInteraction,
) {
	const hosting = interaction.values?.at(0);

	if (!hosting) {
		return interaction.reply({
			content: "Nie wybrano hostingu!",
			flags: 64,
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
			flags: 64,
		});
	}

	const currentDate = new Date();

	const modal = new ModalBuilder()
		.setTitle(`Oferta ${hosting}`)
		.setCustomId(`offer_${hosting}_${currentDate.getTime()}`)
		.addComponents(
			new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId("count")
					.setPlaceholder("Ilość wPLN (np. 1000)")
					.setLabel("Ilość wPLN")
					.setMaxLength(5)
					.setStyle(TextInputStyle.Short)
					.setRequired(true),
			),
			new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId("exchange")
					.setPlaceholder("Kurs sprzedaży wPLN (np. 2.00 lub 0.5)")
					.setLabel("Kurs")
					.setStyle(TextInputStyle.Short)
					.setMaxLength(3)
					.setRequired(true),
			),
			new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId("methods")
					.setPlaceholder("Metody płatności (np. Przelew, PayPal, Revolut)")
					.setLabel("Metody płatności")
					.setStyle(TextInputStyle.Short)
					.setRequired(true),
			),
			new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId("additional_information")
					.setPlaceholder("Dodatkowe informacje (np. Wymagania, inne)")
					.setLabel("Dodatkowe informacje")
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
				flags: 64,
			})
			.catch(() => null);
	}

	const count = Number(response.fields.getField("count").value);
	const exchange = Number(response.fields.getField("exchange").value);

	if (isNaN(exchange) || isNaN(count) || exchange <= 0 || count <= 0) {
		return response.reply({
			content: "Kurs i ilość muszą być liczbami!",
			flags: 64,
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
			flags: 64,
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
			methods: response.fields.getField("methods").value,
			count: Number(response.fields.getField("count").value),
			additional_information: response.fields.getField("additional_information")
				.value,
		},
	});
	const susUserContainer = new ContainerBuilder()
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`# Podejrzany sprzedawca\nUwaga, <@${susUser?.userId}> został oznaczony jako podejrzany sprzedawca. Dla bezpieczeństwa kupującego, wszelkie płatności powinny odbywać się za pośrednictwem middlemana.`),
		)
		.addSeparatorComponents(
			new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
		)
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent("**Pamiętaj!** Usługa middlemana jest w pełni darmowa oraz jest realizowana przez administracje tego serwera na prywatnym kanale, zapewniając bezpieczeństwo dokonywanej transakcji."),
		);

	const channel = client.channels.cache.get(
		client.config.wpln_forum,
	) as GuildChannel;

	let message: ForumThreadChannel | Message;
	if (channel.isThreadOnly()) {
		const tag = channel.availableTags.find(
			(t) => t.name?.toLowerCase() === dbHosting.name?.toLowerCase(),
		);

		message = await channel.threads
			.create({
				name: `Oferta ${response.user.username}`,
				autoArchiveDuration: 60,
				message: {
					components: [container],
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
				components: [container],
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
			flags: 64,
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
				count: Number(response.fields.getField("count").value),
				paymentMethod: response.fields.getField("methods").value,
				additionalInfo: response.fields.getField("additional_information")
					.value,
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
				flags: 64,
			})
			.catch(() => null);
	}

	await response
		.reply({
			content: "Utworzono ofertę!",
			flags: 64,
		})
		.catch(() => null);
}
