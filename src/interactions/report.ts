import Ryneczek from '@classes/Ryneczek';
import {
	ButtonInteraction, EmbedBuilder,
	GuildMemberRoleManager,
} from 'discord.js';

export async function run(client: Ryneczek, interaction: ButtonInteraction) {
	if (!(interaction.member.roles as GuildMemberRoleManager).cache.get(client.config.admin_role)) return interaction.reply({ content: 'Nie możesz zarządzaj zgłoszeniami!', ephemeral: true });

	const action = interaction.customId.split('_')[1];

	if(!['accept', 'reject'].includes(action)) return;

	const embed = EmbedBuilder.from(interaction.message.embeds[0]);

	if(action === 'accept') {
		embed.setColor('#87b55b')
			.setFooter({
				text: 'Zaakceptowane przez ' + interaction.user.tag,
			});
		await interaction.reply({ content: 'Zgłoszenie zostało zaakceptowane! W celu ukarania użytkownika użyj `ban` znajdującego się w context menu (PPM na użytkownika).', ephemeral: true });
	}
	else {
		embed.setColor('#b55b5b')
			.setFooter({
				text: 'Odrzucone przez ' + interaction.user.tag,
			});
		await interaction.deferUpdate();
	}

	await interaction.message.edit({ embeds: [embed], components: [] });
}
