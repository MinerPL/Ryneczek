import {
	ActionRowBuilder,
	BaseGuildTextChannel,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
	GuildMember,
	ModalBuilder,
	SlashCommandBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import Ryneczek from "#client";

export const data = {
	...new SlashCommandBuilder()
		.setName("report")
		.setDescription("Zgłoś użytkownika łamiącego regulamin")
		.addUserOption((option) =>
			option
				.setName("użytkownik")
				.setDescription("Wybierz użytkownika łamiącego regulamin")
				.setRequired(true),
		)
		.setContexts(0)
		.toJSON(),
};

export async function run(
	client: Ryneczek,
	interaction: ChatInputCommandInteraction,
) {
	const user = interaction.options.getMember("użytkownik") as GuildMember;
	const reportTimestamp = Date.now();

	const reportModal = new ModalBuilder()
		.setTitle("Zgłoś użytkownika")
		.setCustomId("report_user_" + reportTimestamp)
		.addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setLabel("Powód zgłoszenia")
					.setStyle(TextInputStyle.Paragraph)
					.setCustomId("report_reason")
					.setPlaceholder("Podaj powód zgłoszenia")
					.setMinLength(10)
					.setMaxLength(2000)
					.setRequired(true),
			),
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setLabel("Dowody (linki)")
					.setStyle(TextInputStyle.Paragraph)
					.setCustomId("report_link")
					.setPlaceholder("Podaj link do dowodu (każdy w nowej linii)")
					.setMinLength(10)
					.setMaxLength(4000)
					.setRequired(true),
			),
		)
		.toJSON();

	const modalUse = await client.useModal(
		interaction,
		reportModal,
		client.ms("5m"),
	);
	if (!modalUse) {
		return;
	}

	await modalUse.reply({
		content: "Zgłoszenie zostało wysłane!",
		flags: 64,
	});

	const reason = modalUse.fields.getTextInputValue("report_reason");
	const links = modalUse.fields.getTextInputValue("report_link");

	const embed = new EmbedBuilder()
		.setColor("#daa520")
		.setTitle("Nowe zgłoszenie")
		.setTimestamp()
		.setFields([
			{
				name: "Zgłaszający",
				value: interaction.member.toString(),
				inline: true,
			},
			{
				name: "Zgłoszony",
				value: user.toString(),
				inline: true,
			},
			{
				name: "Powód",
				value: reason,
			},
			{
				name: "Dowody",
				value: links,
			},
		]);

	const components = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setLabel("Przyjmij")
			.setStyle(ButtonStyle.Success)
			.setCustomId("report_accept_" + reportTimestamp),
		new ButtonBuilder()
			.setLabel("Odrzuć")
			.setStyle(ButtonStyle.Danger)
			.setCustomId("report_reject_" + reportTimestamp),
	);

	await (
		client.channels.cache.get(
			client.config.report_channel,
		) as BaseGuildTextChannel
	)?.send({ embeds: [embed], components: [components] });
}
