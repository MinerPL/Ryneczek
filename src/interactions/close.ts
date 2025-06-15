import { createTranscript } from "discord-html-transcripts";
import {
	ButtonInteraction,
	GuildMemberRoleManager,
	GuildTextBasedChannel,
	TextBasedChannel,
} from "discord.js";
import Ryneczek from "#client";

export async function run(client: Ryneczek, interaction: ButtonInteraction) {
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
		) ||
		offerChannel.offert.userId !== interaction.user.id
	) {
		return interaction.reply({
			content:
				"Nie masz uprawnień do zamknięcia tego kanału. Musisz być administratorem lub właścicielem oferty.",
			flags: 64,
		});
	}

	if (!interaction.channel.isTextBased()) {
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

	// @ts-expect-error
	const transcript = await createTranscript(interaction.channel, {
		returnType: "attachment",
		filename: `${sale.id}-${sale.offert.id}-${sale.offert.userId}-${sale.buyerId}.html`,
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

	await archiveChannel.send({
		content: `Transkrypt sprzedaży ${sale.offert.userId} - ${sale.buyerId} (${hosting.name})`,
		files: [transcript],
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
}
