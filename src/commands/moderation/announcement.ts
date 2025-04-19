import Ryneczek from "@classes/Ryneczek";
import {
	BaseGuildTextChannel,
	ChannelType,
	ChatInputCommandInteraction,
	ColorResolvable,
	EmbedBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";

export const data = {
	...new SlashCommandBuilder()
		.setName("announcement")
		.setDescription("Wysyła ogłoszenie na wybrany kanał.")
		.setContexts(0)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addChannelOption((option) =>
			option
				.setName("kanał")
				.setDescription("Kanał, na który ma zostać wysłane ogłoszenie.")
				.addChannelTypes(ChannelType.GuildAnnouncement, ChannelType.GuildText)
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("tytuł")
				.setDescription("Tytuł ogłoszenia.")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("treść")
				.setDescription("Treść ogłoszenia.")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("kolor")
				.setDescription("Kolor ogłoszenia.")
				.setRequired(false),
		)
		.toJSON(),
};

export async function run(
	_client: Ryneczek,
	interaction: ChatInputCommandInteraction,
) {
	const channel = interaction.options.getChannel(
		"kanał",
	) as BaseGuildTextChannel;
	const title = interaction.options.getString("tytuł");
	const content = interaction.options.getString("treść");
	const color = (interaction.options.getString("kolor") ||
		"#87b55b") as ColorResolvable;

	const embed = new EmbedBuilder()
		.setTitle(title)
		.setDescription(content)
		.setColor(color)
		.setFooter({
			text: interaction.guild.name,
			iconURL: interaction.guild.iconURL(),
		})
		.setTimestamp();

	await channel.send({ embeds: [embed] });
	await interaction.reply({ content: "Wysłano ogłoszenie.", flags: 64 });
}
