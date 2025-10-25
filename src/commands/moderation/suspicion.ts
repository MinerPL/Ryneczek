import {
	ActionRowBuilder,
	ChatInputCommandInteraction,
	ContainerBuilder,
	MessageFlags,
	ModalActionRowComponentBuilder,
	ModalBuilder,
	PermissionFlagsBits,
	PermissionsBitField,
	SlashCommandBuilder,
	TextDisplayBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import Ryneczek from "#client";

export const data = {
	...new SlashCommandBuilder()
		.setName("suspicion")
		.setDescription("Zarządzaj podejrzanymi ofertami.")
		.setContexts(0)
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("trigger")
				.setDescription("Zgłasza podejrzenie oszustwa.")
				.addUserOption((option) =>
					option.setName("user").setDescription("Użytkownik do przywołania").setRequired(true),
				)
		)
		.addSubcommandGroup((group) =>
			group
				.setName("user")
				.setDescription("Zarządzaj podejrzanymi użytkownikami.")
				.addSubcommand((subcommand) =>
					subcommand
						.setName("info")
						.setDescription("Pobiera informacje o podejrzanym użytkowniku.")
						.addUserOption((option) =>
							option.setName("user").setDescription("Użytkownik do sprawdzenia").setRequired(true),
						),
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("add")
						.setDescription("Dodaje użytkownika do listy podejrzanych.")
						.addUserOption((option) =>
							option.setName("user").setDescription("Użytkownik do dodania").setRequired(true),
						),
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("remove")
						.setDescription("Usuwa użytkownika z listy podejrzanych.")
						.addUserOption((option) =>
							option.setName("user").setDescription("Użytkownik do usunięcia").setRequired(true),
						),
				),
		)
		.toJSON(),
};

export async function run(
	client: Ryneczek,
	interaction: ChatInputCommandInteraction,
) {
	switch (interaction.options.getSubcommand()) {
		case "trigger": {
			const user = interaction.options.getUser("user", true);
			const offerChannel = await client.prisma.sales.findFirst({
				where: {
					channelId: interaction.channel.id,
				},
				include: {
					offert: true,
				},
			});
			if (!offerChannel) {
				return interaction.reply({
					content: "To nie jest kanał sprzedaży!",
					flags: 64,
				});
			}
			await interaction.channel.permissionsFor(user.id).add(PermissionsBitField.Flags.ViewChannel);
			await interaction.channel.send({
				content: `<@${user.id}>`,
			}).then(msg => setTimeout(() => msg.delete().catch(() => null), 500));
			return interaction.reply({
				content: `Pomyślnie przywołano <@${user.id}>.`,
				flags: 64,
			});
		}
		case "info": {
			const user = interaction.options.getUser("user", true);
			const suspicions = await client.prisma.suspicions.findFirst({
				where: {
					userId: user.id,
				},
			});
			if (!suspicions) {
				return interaction.reply({
					content: "Ten użytkownik nie jest na liście podejrzanych.",
					flags: 64,
				});
			}
			return interaction.reply({
				components: [
					new ContainerBuilder().addTextDisplayComponents(
						new TextDisplayBuilder().setContent(`# Informacje o użytkowniku\nUżytkownik <@${user.id}> znajduje się na liście podejrzanych sprzedawców z powodu \`${suspicions.reason}\`.\n> Dodany <t:${Math.floor(suspicions.createdAt.getTime() / 1000)}:F> przez <@${suspicions.adminId}>`)
					)
				],
				flags: [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral],
			});
		}
		case "add": {
			const user = interaction.options.getUser("user", true);
			const existing = await client.prisma.suspicions.findFirst({
				where: {
					userId: user.id,
				},
			});
			if (existing) {
				return interaction.reply({
					content: "Ten użytkownik jest już na liście podejrzanych.",
					flags: 64,
				});
			}
			const modal = new ModalBuilder()
				.setCustomId("suspicion_add_reason")
				.setTitle("Powód dodania do listy podejrzanych")
				.addComponents(
					new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
						new TextInputBuilder()
							.setCustomId("reason")
							.setLabel("Podaj powód")
							.setStyle(TextInputStyle.Short)
							.setMinLength(10)
							.setMaxLength(400)
							.setPlaceholder("Podaj powód dodania użytkownika do listy podejrzanych")
							.setRequired(true),
					),
				);
			const modalSubmit = await client.useModal(
				interaction,
				modal.toJSON(),
				client.ms("5m"),
			);
			if (!modalSubmit) {
				return;
			}
			const reason = modalSubmit.fields.getTextInputValue("reason");
			await client.prisma.suspicions.create({
				data: {
					userId: user.id,
					reason,
					adminId: interaction.user.id,
				},
			});
			return modalSubmit.reply({
				content: `Pomyślnie dodano <@${user.id}> do listy podejrzanych.`,
				flags: 64,
			});
		}
		case "remove": {
			const user = interaction.options.getUser("user", true);
			const existing = await client.prisma.suspicions.findFirst({
				where: {
					userId: user.id,
				},
			});
			if (!existing) {
				return interaction.reply({
					content: "Ten użytkownik nie jest na liście podejrzanych.",
					flags: 64,
				});
			}
			await client.prisma.suspicions.deleteMany({
				where: {
					userId: user.id,
				},
			});
			return interaction.reply({
				content: `Pomyślnie usunięto <@${user.id}> z listy podejrzanych.`,
				flags: 64,
			});
		}
		default: {
			return interaction.reply({
				content: "Nieznana podkomenda.",
				flags: 64,
			});
		}
	}
}
