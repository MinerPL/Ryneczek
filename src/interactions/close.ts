import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	CheckboxBuilder,
	ContainerBuilder,
	FileBuilder,
	GuildMemberRoleManager,
	GuildTextBasedChannel,
	LabelBuilder,
	LabelComponent,
	MessageFlags,
	ModalBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
	TextInputBuilder,
	User,
} from "discord.js";
import { TextInputStyle } from "discord-api-types/v10";
import { createTranscript, ExportReturnType } from "discord-html-transcripts";
import Ryneczek from "#client";

export async function run(client: Ryneczek, interaction: ButtonInteraction) {
	try {
		if (
			!(interaction.member.roles as GuildMemberRoleManager).cache.has(
				client.config.admin_role,
			)
		) {
			return interaction.reply({
				content:
					"Nie masz uprawnień do zamknięcia tej sprzedaży! Skontaktuj się z administratorem w celu zamknięcia sprzedaży.",
				flags: MessageFlags.Ephemeral,
			});
		}

		const adminSurvey = new ModalBuilder()
			.addLabelComponents(
				new LabelBuilder()
					.setLabel("Czy transakcja doszła do skutku?")
					.setCheckboxComponent(
						new CheckboxBuilder()
							.setCustomId("transactionOutcome")
							.setDefault(true),
					),
				new LabelBuilder()
					.setLabel("Kwota transakcji (w wPLN)")
					.setTextInputComponent(
						new TextInputBuilder()
							.setCustomId("transactionAmount")
							.setRequired(true)
							.setStyle(TextInputStyle.Short),
					),
			)
			.setCustomId("adminSurveyModal")
			.setTitle("Ankieta dla administratora")
			.toJSON();

		const modal = await client.useModal(interaction, adminSurvey);

		if (!modal) {
			return interaction.reply({
				content: "Wystąpił błąd podczas tworzenia ankiety!",
				flags: MessageFlags.Ephemeral,
			});
		}

		await modal.deferReply({ flags: MessageFlags.Ephemeral });

		const transactionStatus = modal.fields
			.getCheckbox("transactionOutcome")
			.valueOf();
		const transactionAmount = modal.fields
			.getTextInputValue("transactionAmount")
			.valueOf();

		const transactionAmountFloat = parseFloat(transactionAmount);

		if (isNaN(transactionAmountFloat) || transactionAmountFloat < 0) {
			return modal.editReply({
				content: "Wprowadzona kwota transakcji jest nieprawidłowa!",
			});
		}

		if (!interaction.channel.isTextBased() || interaction.channel.isDMBased()) {
			return modal.editReply({
				content: "Nie można utworzyć transkryptu na tym kanale!",
			});
		}

		const sale = await client.prisma.sales.findFirst({
			where: {
				channelId: interaction.channel.id,
			},
			include: {
				offert: true,
			},
		});

		if (!sale) {
			return modal.editReply({
				content: "Nie znaleziono sprzedaży dla tego kanału!",
			});
		}

		const transcriptFilename = `${sale.id}-${sale.offert.id}-${sale.offert.userId}-${sale.buyerId}.html`;

		// @ts-expect-error
		const transcript = await createTranscript(interaction.channel, {
			returnType: ExportReturnType.Attachment,
			filename: transcriptFilename,
		});

		const archiveChannel = client.channels.cache.get(
			client.config.ticket_archive,
		) as GuildTextBasedChannel;

		if (!archiveChannel) {
			return modal.editReply({
				content: "Nie można znaleźć kanału archiwizacji!",
			});
		}

		const hosting = await client.prisma.hostings.findFirst({
			where: {
				id: sale.offert.hostingId,
			},
		});

		const seller: User | null =
			client.users.cache.get(sale.offert.userId) ||
			(await client.users.fetch(sale.offert.userId).catch(() => null));
		const buyer: User | null =
			client.users.cache.get(sale.buyerId) ||
			(await client.users.fetch(sale.buyerId).catch(() => null));

		const sellerInfo = seller
			? `${seller.username} (<@${seller.id}>, ${seller.id})`
			: `Nie znaleziono użytkownika (<@${sale.offert.userId}>, ${sale.offert.userId})`;
		const buyerInfo = buyer
			? `${buyer.username} (<@${buyer.id}>, ${buyer.id})`
			: `Nie znaleziono użytkownika (<@${sale.buyerId}>, ${sale.buyerId})`;
		const hostingInfo = hosting?.name ?? `ID ${sale.offert.hostingId}`;
		const paymentMethod = sale.offert.paymentMethod || "Brak";

		await archiveChannel.send({
			flags: [MessageFlags.IsComponentsV2],
			files: [transcript],
			components: [
				new ContainerBuilder()
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							`# Sprzedawca\nKonto: ${sellerInfo}`,
						),
					)
					.addSeparatorComponents(
						new SeparatorBuilder()
							.setSpacing(SeparatorSpacingSize.Small)
							.setDivider(true),
					)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							`# Kupujący\nKonto: ${buyerInfo}`,
						),
					)
					.addSeparatorComponents(
						new SeparatorBuilder()
							.setSpacing(SeparatorSpacingSize.Small)
							.setDivider(true),
					)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent(
							`# Dodatkowe informacje\n**Zamknięte przez:** <@${interaction.user.id}> (${interaction.user.id})\n**Hosting:** ${hostingInfo}\n**Metoda płatności:** ${paymentMethod}\n**Kwota:** ${sale.amount}`,
						),
					)
					.addSeparatorComponents(
						new SeparatorBuilder()
							.setSpacing(SeparatorSpacingSize.Small)
							.setDivider(true),
					)
					.addTextDisplayComponents(
						new TextDisplayBuilder().setContent("# Transkrypcja"),
					)
					.addFileComponents(
						new FileBuilder().setURL(`attachment://${transcriptFilename}`),
					),
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setLabel("Stwórz zgłoszenie")
						.setStyle(ButtonStyle.Danger)
						.setCustomId(`report_create_${sale.offert.userId}_${sale.buyerId}`),
				),
			],
		});

		await modal
			.editReply({
				content: "Transkrypt został wysłany do archiwum!",
			})
			.catch(() => null);

		await client.prisma.sales.update({
			where: {
				id: sale.id,
			},
			data: {
				isDone: transactionStatus,
				realCount: transactionAmountFloat,
			},
		});

		const components = [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setLabel("Oceń transakcję")
					.setStyle(ButtonStyle.Primary)
					.setCustomId(`rate_${sale.id}`),
			),
		];

		if (buyer) {
			await buyer.createDM().catch(() => null);

			await buyer.send({
				content: `**Potrzebna twoja opinia!**\n\nOceń swoją transakcję zakupu wPLN u użytkownika <@${sale.offert.userId}>.\n\nKliknij przycisk poniżej, aby ocenić transakcję.`,
				components: components,
			});
		}

		await interaction.channel.delete();
	} catch (e) {
		console.log(e);
		if (interaction.deferred || interaction.replied) {
			return interaction.followUp({
				content: `Wystąpił błąd podczas przetwarzania tej interakcji.\n\n\`\`\`${e.message}\`\`\``,
				flags: MessageFlags.Ephemeral,
			});
		} else {
			return interaction.reply({
				content: `Wystąpił błąd podczas przetwarzania tej interakcji.\n\n\`\`\`${e.message}\`\`\``,
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
