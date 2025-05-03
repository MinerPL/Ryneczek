import {
	ActionRowBuilder,
	ButtonInteraction,
	ForumChannel,
	GuildMemberRoleManager,
	ModalActionRowComponentBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import Ryneczek from "#client";
import { OfferContainer } from "#utils/OfferContainer";

export async function run(client: Ryneczek, interaction: ButtonInteraction) {
	const action = interaction.customId.split("_")[1];

	const offertOwner = await client.prisma.offerts.findFirst({
		where: {
			messageId: interaction.message.id,
		},
	});

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
		if (interaction.channel.isThread()) {
			await interaction.channel.setAppliedTags([
				(interaction.channel.parent as ForumChannel).availableTags.find(
					(tag) => tag.name?.toLowerCase() === "sprzedane",
				).id,
			]);

			await interaction.channel.setArchived(true);
		} else {
			await interaction.message.delete();
		}

		return client.prisma.offerts.update({
			where: {
				id: offertOwner.id,
			},
			data: {
				selled: true,
			},
		});
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
	}
}
