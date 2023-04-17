import {
	ActionRowBuilder,
	ApplicationCommandType, BaseGuildTextChannel,
	ContextMenuCommandBuilder,
	ContextMenuCommandInteraction, EmbedBuilder, ModalActionRowComponentBuilder, ModalBuilder,
	PermissionFlagsBits, TextInputBuilder,
} from 'discord.js';
import Ryneczek from '@classes/Ryneczek';
import { TextInputStyle } from 'discord-api-types/v10';

export const data = {
	...new ContextMenuCommandBuilder()
		.setName('Ban')
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
		.setType(ApplicationCommandType.User),
};

export async function run(client: Ryneczek, interaction: ContextMenuCommandInteraction) {
	const user = interaction.targetId;
	const member = await client.users.fetch(user);

	if(!member) return interaction.reply({ content: 'Nie znaleziono użytkownika!', ephemeral: true });

	const reasonModal = new ModalBuilder()
		.setTitle('Podaj powód')
		.setCustomId('reason')
		.addComponents(
			new ActionRowBuilder<ModalActionRowComponentBuilder>()
				.addComponents(
					new TextInputBuilder()
						.setStyle(TextInputStyle.Paragraph)
						.setLabel('Powód')
						.setCustomId('reason')
						.setPlaceholder('Dlaczego chcesz zbanować tego użytkownika? Powód będzie dostępny publicznie.')
						.setMinLength(1)
						.setMaxLength(1000)
						.setRequired(true),
				),
		)
		.toJSON();

	const modal = await client.useModal(interaction, reasonModal, client.ms('5m'));

	const reason = modal.fields.getTextInputValue('reason');

	const embed = new EmbedBuilder()
		.setColor('#87b55b')
		.setDescription(`[${new Date().getDate()}.${new Date().getMonth() + 1}.${new Date().getFullYear()}] **${member.tag}** (${member.id}) został zbanowany za: **${reason}**`)
		.setFooter({
			iconURL: interaction.guild.iconURL(),
			text: interaction.guild.name,
		})
		.setTimestamp();

	interaction.guild.bans.create(user, { reason: `[${interaction.user.tag}] ${reason}` }).then(() => {
		(client.channels.cache.get(client.config.moderation_alerts) as BaseGuildTextChannel)?.send({ embeds: [embed] });
		modal.reply({ content: 'Sukces!', ephemeral: true });
	})
		.catch(e => {
			console.error(e);
			return modal.reply({ content: `Coś poszło nie tak!\n\nBłąd: ${e.message}`, ephemeral: true });
		});
}
