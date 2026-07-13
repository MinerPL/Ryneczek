import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	CategoryChannel,
	ContainerBuilder,
	GuildMemberRoleManager,
	LabelBuilder,
	ModalActionRowComponentBuilder,
	ModalBuilder,
	RadioGroupBuilder,
	RadioGroupOptionBuilder,
	SeparatorBuilder,
	TextDisplayBuilder,
	TextInputBuilder,
	TextInputModalData,
	TextInputStyle,
} from "discord.js";
import {
	ButtonStyle,
	MessageFlags,
	SeparatorSpacingSize,
} from "discord-api-types/v10";
import Ryneczek from "#client";
import { CloseOffert } from "#utils/CloseOffert";
import { OfferContainer } from "#utils/OfferContainer";

export async function run(client: Ryneczek, interaction: ButtonInteraction) {
	const action = interaction.customId.split("_")[1];

	const offertOwner = await client.prisma.offerts.findFirst({
		where: {
			messageId: interaction.message.id,
		},
		include: {
			hosting: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});

	if (!offertOwner) {
		return interaction.reply({
			content: "Nie znaleziono oferty!",
			flags: MessageFlags.Ephemeral,
		});
	}

	if (interaction.channel.isThread() && interaction.channel.archived) {
		return interaction.reply({
			content: "Nie możesz kupić oferty w archiwum!",
			flags: MessageFlags.Ephemeral,
		});
	}

	if (
		["sold", "change"].includes(action) &&
		!(interaction.member.roles as GuildMemberRoleManager).cache.has(
			client.config.admin_role,
		)
	) {
		if (offertOwner.userId !== interaction.user.id) {
			return interaction.reply({
				content: "Nie jesteś właścicielem tej oferty!",
				flags: MessageFlags.Ephemeral,
			});
		}
	}

	if (action === "sold") {
		await interaction.reply({
			content: "Oferta oznaczona jako sprzedana!",
			flags: MessageFlags.Ephemeral,
		});

		await CloseOffert(client, interaction.channel, offertOwner);
	} else if (action === "change") {
		const hosting = await client.prisma.hostings.findFirst({
			where: {
				id: offertOwner.hostingId,
			},
		});

		const exchange = offertOwner.exchange;
		let oldExchange: number;
		let newExchange: number;
		if (exchange < 1) {
			oldExchange = exchange;
			newExchange = Number((1 / exchange).toFixed(2));
		} else {
			newExchange = exchange;
			oldExchange = Number((1 / exchange).toFixed(2));
		}

		const modalBuilder = new ModalBuilder()
			.setTitle("Edycja oferty")
			.setCustomId("offer2_change")
			.addComponents(
				new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
					new TextInputBuilder()
						.setLabel("Nowa ilość wPLN")
						.setCustomId("count")
						.setMaxLength(5)
						.setPlaceholder("Ilość wPLN")
						.setValue(String(offertOwner.count))
						.setStyle(TextInputStyle.Short)
						.setRequired(true),
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

		const count = Number(
			(modal.fields.getField("count") as TextInputModalData).value,
		);
		if (isNaN(count) || count <= 0) {
			return modal.reply({
				content: "Ilość musi być liczbą!",
				flags: MessageFlags.Ephemeral,
			});
		}

		const container = OfferContainer({
			dbHosting: hosting,
			OfferDetails: {
				user: interaction.user,
				newExchange: newExchange,
				oldExchange: oldExchange,
				methods: offertOwner.paymentMethod,
				count: count,
				additional_information: offertOwner.additionalInfo || "Brak",
			},
		});

		await interaction.message.edit({
			components: [container],
		});
		return modal.reply({
			content: "Oferta zmieniona!",
			flags: MessageFlags.Ephemeral,
		});
	} else if (action === "buy") {
		if (offertOwner.userId === interaction.user.id) {
			return interaction.reply({
				content: "Nie możesz kupić swojej oferty!",
				flags: MessageFlags.Ephemeral,
			});
		}

		const category = interaction.guild.channels.cache.get(
			client.config.ticket_category,
		) as CategoryChannel;

		if (!category) {
			return interaction.reply({
				content: "Nie znaleziono kategorii! Skontaktuj się z administracją.",
				flags: MessageFlags.Ephemeral,
			});
		}

		if (
			!(await interaction.guild.members
				.fetch(offertOwner.userId)
				.catch(() => null))
		) {
			return interaction.reply({
				content: "Właściciel oferty nie jest już na serwerze!",
				flags: MessageFlags.Ephemeral,
			});
		}

		const currentUserBuyOfferts = await client.prisma.sales.findMany({
			where: {
				buyerId: interaction.user.id,
				isClosed: false,
				offertId: offertOwner.id,
			},
		});

		if (currentUserBuyOfferts.length > 0) {
			return interaction.reply({
				content: `Już masz otwarty ticket! (${currentUserBuyOfferts.map((channel) => `<#${channel.channelId}>`).join(", ")})`,
				flags: MessageFlags.Ephemeral,
			});
		}

		const currentDate = new Date();

		const modalBuilder = new ModalBuilder()
			.setTitle("Kupno")
			.setCustomId(`buy_modal_${currentDate.getTime()}`)
			.addComponents(
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setLabel("Ilość wPLN")
						.setPlaceholder("Ilość wPLN")
						.setStyle(TextInputStyle.Short)
						.setCustomId("amount")
						.setRequired(true),
				),
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setLabel("Metoda płatności")
						.setPlaceholder("np. PayPal, Revolut, Przelew")
						.setStyle(TextInputStyle.Short)
						.setCustomId("payment_method")
						.setRequired(true),
				),
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setLabel("Email Lub ID konta kupującego")
						.setPlaceholder("np. contact@minerpl.xyz lub 2137")
						.setStyle(TextInputStyle.Short)
						.setCustomId("buyer_details")
						.setRequired(true),
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

		const amount = Number(
			(modal.fields.getField("amount") as TextInputModalData).value,
		);
		const paymentMethod = (
			modal.fields.getField("payment_method") as TextInputModalData
		).value;

		if (isNaN(amount) || amount <= 0) {
			return modal.reply({
				content: "Ilość musi być liczbą!",
				flags: MessageFlags.Ephemeral,
			});
		}

		if (amount > offertOwner.count) {
			return modal.reply({
				content: `Nie możesz kupić więcej niż ${offertOwner.count} wPLN!`,
				flags: MessageFlags.Ephemeral,
			});
		}

		const channel = await interaction.guild.channels.create({
			name: `sprzedaz-${interaction.user.username}`,
			parent: category.id,
			permissionOverwrites: [
				{
					id: interaction.guild.id,
					deny: ["ViewChannel"],
				},
				{
					id: client.config.admin_role,
					allow: ["ViewChannel"],
				},
				{
					id: interaction.user.id,
					allow: ["ViewChannel"],
				},
				{
					id: offertOwner.userId,
					allow: ["ViewChannel"],
				},
			],
		});

		if (!channel) {
			return modal.reply({
				content: "Nie udało się stworzyć ticketu!",
				flags: MessageFlags.Ephemeral,
			});
		}

		await client.prisma.sales.create({
			data: {
				offertId: offertOwner.id,
				buyerId: interaction.user.id,
				amount: amount,
				channelId: channel.id,
				isDone: false,
				isClosed: false,
			},
		});

		await modal
			.reply({
				content: `Stworzono kanał <#${channel.id}>!`,
				flags: MessageFlags.Ephemeral,
			})
			.catch(() => null);

		const price = (amount / offertOwner.exchange).toFixed(2);
		const buyersDetails =
			modal.fields.getTextInputValue("buyer_details")?.trim() || "Brak";

		const container = new ContainerBuilder()
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`Witaj ${interaction.user}! Na tym kanale możesz porozmawiać z właścicielem oferty <@${offertOwner.userId}> o szczegółach zakupu.\n\n**Hosting:** ${offertOwner.hosting.name}\n**Ilość:** ${amount}\n**Metoda Płatności:** ${paymentMethod}\n**Koszt za wybraną ilość wpln:** ${price}zł\n**Email/ID Kupującego:** ||${buyersDetails}||\n\n**Pamiętaj!** Jest to jedyne bezpieczne miejsce do dokonywania zakupów. Nie ufaj nikomu, kto prosi o kontakt na privie! Jeżeli nie jesteś pewien transakcji zapytaj moderacji o opcje "middleman"!\n\nPrzed zamknięciem ticketa wystaw opinię!`,
				),
			)
			.addSeparatorComponents(
				new SeparatorBuilder()
					.setSpacing(SeparatorSpacingSize.Small)
					.setDivider(false),
			)
			.addActionRowComponents(
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setLabel("Zamknij kanał")
						.setCustomId("close_ticket")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("🔒"),
					new ButtonBuilder()
						.setLabel("Poproś o middlemana")
						.setCustomId("request_middleman")
						.setStyle(ButtonStyle.Secondary)
						.setEmoji("🤝"),
				),
			);

		await channel.send({
			flags: MessageFlags.IsComponentsV2,
			components: [container],
		});
	} else if (action === "before") {
		const modal = new ModalBuilder()
			.setCustomId("calculate_modal")
			.setTitle("Przelicz kurs")
			.addLabelComponents(
				new LabelBuilder()
					.setLabel("Którego przeliczniku chcesz użyć?")
					.setRadioGroupComponent(
						new RadioGroupBuilder()
							.setRequired(true)
							.setCustomId("radio_group")
							.setOptions(
								new RadioGroupOptionBuilder()
									.setLabel("wPLN -> PLN")
									.setValue("wpln_pln")
									.setDescription("Przelicz kurs z wPLN na PLN"),
								new RadioGroupOptionBuilder()
									.setLabel("PLN -> wPLN")
									.setValue("pln_wpln")
									.setDescription("Przelicz kurs z PLN na wPLN"),
							),
					),
				new LabelBuilder()
					.setLabel("Wpisz kwotę do przeliczenia")
					.setTextInputComponent(
						new TextInputBuilder()
							.setCustomId("wpln")
							.setStyle(TextInputStyle.Short),
					),
			)
			.toJSON();

		const modalResponse = await client.useModal(interaction, modal);

		if (!modalResponse) {
			return;
		}

		const type = modalResponse.fields.getRadioGroup("radio_group").valueOf();
		const amount = Number(modalResponse.fields.getTextInputValue("wpln"));

		if (isNaN(amount) || amount <= 0) {
			return modalResponse.reply({
				content: "Kwota musi być liczbą większą od 0!",
				flags: MessageFlags.Ephemeral,
			});
		}

		if (type === "wpln_pln") {
			const final = amount * offertOwner.exchange;

			await modalResponse.reply({
				content: `Za ${amount} wPLN zapłacisz ~${final.toFixed(2)} PLN`,
				flags: MessageFlags.Ephemeral,
			});
		} else if (type === "pln_wpln") {
			const final = amount / offertOwner.exchange;

			await modalResponse.reply({
				content: `Za ${amount} PLN otrzymasz ~${final.toFixed(2)} wPLN`,
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
