import { MessageFlags } from "discord-api-types/v10";
import {
	ActionRowBuilder,
	ChannelType,
	ChatInputCommandInteraction,
	ContainerBuilder,
	ForumChannel,
	GuildChannel,
	GuildMember,
	GuildTextBasedChannel,
	MessageActionRowComponentBuilder,
	PermissionFlagsBits,
	SelectMenuOptionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	TextDisplayBuilder,
} from "discord.js";
import Ryneczek from "#client";

export const data = {
	...new SlashCommandBuilder()
		.setName("offerembed")
		.setDescription("Embed od wplnów")
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setRequired(true)
				.setDescription("Kanał")
				.addChannelTypes(ChannelType.GuildForum, ChannelType.GuildText),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.setContexts(0)
		.toJSON(),
};

export async function run(
	client: Ryneczek,
	interaction: ChatInputCommandInteraction,
) {
	if (
		!(interaction.member as GuildMember).roles.cache.has(
			client.config.admin_role,
		)
	) {
		return interaction.reply({
			content: "Nie masz uprawnień do tej komendy!",
			flags: 64,
		});
	}

	const channel = interaction.options.getChannel("channel") as GuildChannel;

	const hostings = await client.prisma.hostings.findMany();

	const arr = hostings.map((hosting) => {
		return new StringSelectMenuOptionBuilder()
			.setLabel(hosting.name)
			.setValue(hosting.hosting_id)
			.setEmoji(hosting.emoji);
	});

	const container = new ContainerBuilder()
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent("# Kreator oferty"),
		)
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		)
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				"Witaj w kreatorze ofert! Aby utworzyć ofertę **sprzedaży** wPLN należy wybrać hosting z poniższej listy oraz uzupełnić wymagane informacje. \n\n**Uwaga!** Podawanie nieprawdziwych informacji może skutkować permanentnym banem na serwerze.",
			),
		)
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		)
		.addActionRowComponents(
			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
				new StringSelectMenuBuilder().setCustomId("wpln").addOptions(arr),
			),
		);

	await interaction.reply({
		content: "Gotowe.",
		flags: 64,
	});

	if (channel.isThreadOnly()) {
		const thread = await channel.threads.create({
			name: "Utwórz ofertę sprzedaży",
			message: {
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			},
		});

		await thread.pin();
		return;
	} else if (channel.isTextBased()) {
		await channel.send({
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});
		return;
	} else {
		await interaction.editReply({
			content: "Nie można utworzyć oferty w tym kanale.",
		});
		return;
	}
}
