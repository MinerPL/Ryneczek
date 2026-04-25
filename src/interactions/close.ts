import { ExportReturnType, createTranscript } from "discord-html-transcripts";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ContainerBuilder,
	FileBuilder,
	GuildMemberRoleManager,
	GuildTextBasedChannel,
	MessageFlags,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
} from "discord.js";
import Ryneczek from "#client";

export async function run(client: Ryneczek, interaction: ButtonInteraction) {
	try {
		const offerChannel = await client.prisma.sales.findFirst({
			where: {
				channelId: interaction.channel.id,
			},
			include: {
				offert: true,
			},
		});

		if (
			!(interaction.member.roles as GuildMemberRoleManager).cache.has(
				client.config.admin_role,
			) &&
			offerChannel.offert.userId !== interaction.user.id
		) {
			return interaction.reply({
				content:
					"Nie masz uprawnień do zamknięcia tego kanału. Musisz być administratorem lub właścicielem oferty.",
				flags: 64,
			});
		}

		if (!interaction.channel.isTextBased() || interaction.channel.isDMBased()) {
			return interaction.reply({
				content: "Nie można utworzyć transkryptu na tym kanale!",
				flags: 64,
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
			return interaction.reply({
				content: "Nie znaleziono sprzedaży dla tego kanału!",
				flags: 64,
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
			return interaction.reply({
				content: "Nie można znaleźć kanału archiwizacji!",
				flags: 64,
			});
		}

		const hosting = await client.prisma.hostings.findFirst({
			where: {
				id: sale.offert.hostingId,
			},
		});

		const seller =
			client.users.cache.get(sale.offert.userId) ||
			(await client.users.fetch(sale.offert.userId).catch(() => null));
		const buyer =
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
						.setLabel("Stworz zgloszenie")
						.setStyle(ButtonStyle.Danger)
						.setCustomId(
							`report_create_${sale.offert.userId}_${sale.buyerId}`,
						),
				),
			],
		});

		await interaction
			.reply({
				content: "Transkrypt został wysłany do archiwum!",
				flags: 64,
			})
			.catch(() => null);

		await client.prisma.sales.update({
			where: {
				id: sale.id,
			},
			data: {
				isDone: true,
			},
		});

		await interaction.channel.delete();
	} catch (e) {
		console.log(e);
		if (interaction.deferred || interaction.replied) {
			return interaction.followUp({
				content: `Wystąpił błąd podczas przetwarzania tej interakcji.\n\n\`\`\`${e.message}\`\`\``,
				flags: 64,
			});
		} else {
			return interaction.reply({
				content: `Wystąpił błąd podczas przetwarzania tej interakcji.\n\n\`\`\`${e.message}\`\`\``,
				flags: 64,
			});
		}
	}
}
