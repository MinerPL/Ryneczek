import {
	ButtonStyle,
	MessageFlags,
	SeparatorSpacingSize,
} from "discord-api-types/v10";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	CategoryChannel,
	ContainerBuilder,
	ForumChannel,
	GuildMemberRoleManager,
	ModalActionRowComponentBuilder,
	ModalBuilder,
	SeparatorBuilder,
	TextDisplayBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
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
			flags: 64,
		});
	}

	if (interaction.channel.isThread() && interaction.channel.archived) {
		return interaction.reply({
			content: "Nie możesz kupić oferty w archiwum!",
			flags: 64,
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
				flags: 64,
			});
		}
	}

	if (action === "sold") {
		await interaction.reply({
			content: "Oferta oznaczona jako sprzedana!",
			flags: 64,
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
					flags: 64,
				})
				.catch(() => null);
		}

		const count = Number(modal.fields.getField("count").value);
		if (isNaN(count) || count <= 0) {
			return modal.reply({
				content: "Ilość musi być liczbą!",
				flags: 64,
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
			flags: 64,
		});
	} else if (action === "buy") {
		if (offertOwner.userId === interaction.user.id) {
			return interaction.reply({
				content: "Nie możesz kupić swojej oferty!",
				flags: 64,
			});
		}

		const category = interaction.guild.channels.cache.get(
			client.config.ticket_category,
		) as CategoryChannel;

		if (!category) {
			return interaction.reply({
				content: "Nie znaleziono kategorii! Skontaktuj się z administracją.",
				flags: 64,
			});
		}

		if (
			!(await interaction.guild.members
				.fetch(offertOwner.userId)
				.catch(() => null))
		) {
			return interaction.reply({
				content: "Właściciel oferty nie jest już na serwerze!",
				flags: 64,
			});
		}

		const currentUserBuyOfferts = await client.prisma.sales.findMany({
			where: {
				buyerId: interaction.user.id,
				isDone: false,
				offertId: offertOwner.id,
			},
		});

		if (currentUserBuyOfferts.length > 0) {
			return interaction.reply({
				content: `Już masz otwarty ticket! (${currentUserBuyOfferts.map((channel) => `<#${channel.channelId}>`).join(", ")})`,
				flags: 64,
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
					flags: 64,
				})
				.catch(() => null);
		}

		const amount = Number(modal.fields.getField("amount").value);
		const paymentMethod = modal.fields.getField("payment_method").value;

		if (isNaN(amount) || amount <= 0) {
			return modal.reply({
				content: "Ilość musi być liczbą!",
				flags: 64,
			});
		}

		if (amount > offertOwner.count) {
			return modal.reply({
				content: `Nie możesz kupić więcej niż ${offertOwner.count} wPLN!`,
				flags: 64,
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
				flags: 64,
			});
		}

		const sale = await client.prisma.sales.create({
			data: {
				offertId: offertOwner.id,
				buyerId: interaction.user.id,
				amount: amount,
				channelId: channel.id,
				isDone: false,
			},
		});

		await modal
			.reply({
				content: `Stworzono kanał <#${channel.id}>!`,
				flags: 64,
			})
			.catch(() => null);

		const price = (amount / offertOwner.exchange).toFixed(2);
		const buyersDetails = modal.fields.getTextInputValue("buyer_details")?.trim() || "Brak";

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
			)
			.addActionRowComponents(
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setLabel("Oceń pozytywnie")
						.setCustomId(`opinion_positive_${sale.id}`)
						.setStyle(ButtonStyle.Success)
						.setEmoji("👍"),
					new ButtonBuilder()
						.setLabel("Oceń negatywnie")
						.setCustomId(`opinion_negative_${sale.id}`)
						.setStyle(ButtonStyle.Danger)
						.setEmoji("👎"),
				),
			);

		await channel.send({
			flags: MessageFlags.IsComponentsV2,
			components: [container],
		});
	}
}
