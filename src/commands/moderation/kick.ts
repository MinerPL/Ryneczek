import { TextInputStyle } from "discord-api-types/v10";
import {
	ActionRowBuilder,
	ApplicationCommandType,
	BaseGuildTextChannel,
	ContextMenuCommandBuilder,
	ContextMenuCommandInteraction,
	EmbedBuilder,
	ModalActionRowComponentBuilder,
	ModalBuilder,
	PermissionFlagsBits,
	TextInputBuilder,
} from "discord.js";
import Ryneczek from "#client";

export const data = {
	...new ContextMenuCommandBuilder()
		.setName("Kick")
		.setContexts(0)
		.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
		.setType(ApplicationCommandType.User),
};

export async function run(
	client: Ryneczek,
	interaction: ContextMenuCommandInteraction,
) {
	const user = interaction.targetId;
	const member = interaction.guild.members.cache.get(user);

	if (!member) {
		return interaction.reply({
			content: "Nie znaleziono użytkownika!",
			flags: 64,
		});
	}

	const reasonModal = new ModalBuilder()
		.setTitle("Podaj powód")
		.setCustomId("reason")
		.addComponents(
			new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
				new TextInputBuilder()
					.setStyle(TextInputStyle.Paragraph)
					.setLabel("Powód")
					.setCustomId("reason")
					.setPlaceholder(
						"Dlaczego chcesz wyrzucić tego użytkownika? Powód będzie dostępny publicznie.",
					)
					.setMinLength(1)
					.setMaxLength(1000)
					.setRequired(true),
			),
		)
		.toJSON();

	const modal = await client.useModal(
		interaction,
		reasonModal,
		client.ms("5m"),
	);
	if (!modal) {
		return;
	}

	const reason = modal.fields.getTextInputValue("reason");

	let day: string = String(new Date().getDay());
	let month: string = String(new Date().getMonth() + 1);
	const year: string = String(new Date().getFullYear());

	if (Number(day) < 10) {
		day = `0${day}`;
	}
	if (Number(month) < 10) {
		month = `0${month}`;
	}

	const embed = new EmbedBuilder()
		.setColor("#87b55b")
		.setDescription(
			`[${day}.${month}.${year}] **${member.user.tag}** (${member.user.id}) został wyrzucony za: **${reason}**`,
		)
		.setFooter({
			iconURL: interaction.guild.iconURL(),
			text: interaction.guild.name,
		})
		.setTimestamp();

	member
		.kick(reason)
		.then(() => {
			(
				client.channels.cache.get(
					client.config.moderation_alerts,
				) as BaseGuildTextChannel
			)?.send({ embeds: [embed] });
			modal.reply({ content: "Sukces!", flags: 64 });
		})
		.catch((e) => {
			console.error(e);
			return modal.reply({
				content: `Coś poszło nie tak!\n\nBłąd: ${e.message}`,
				flags: 64,
			});
		});
}
