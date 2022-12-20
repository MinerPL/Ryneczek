import { CommandInteraction, GuildMember, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Routes } from 'discord-api-types/v10';
import Ryneczek from '@classes/Ryneczek';

export const data = {
	...new SlashCommandBuilder()
		.setName('deploy')
		.setDescription('Zaktualizuj slashcommands')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.setDMPermission(false)
		.toJSON(),
};

export async function run(client: Ryneczek, interaction: CommandInteraction) {

	if(!(interaction.member as GuildMember).roles.cache.has('811550637518487563')) return interaction.reply({ content: 'Nie masz uprawnień do tej komendy!', ephemeral: true });
	await interaction.deferReply();

	await client.rest.put(
		Routes.applicationGuildCommands(client.user.id, '811550188823904277'),

		{ body: [...client.commands.map(x => x.data), ...client.commands.filter(x => x.data.context).map(x => x.data.context)] },
	);

	await interaction.editReply({ content: 'Pomyslnie zaktualizowano slashcommands!' });
}
