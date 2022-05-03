import { CommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Routes } from 'discord-api-types/v10';
import { REST } from '@discordjs/rest';
import Ryneczek from '@classes/Client';

export default {
	...new SlashCommandBuilder()
		.setName('deploy')
		.setDescription('Zaktualizuj slashcommands')
		.setDefaultPermission(false)
		.toJSON(),
	default_member_permissions: String(PermissionFlagsBits.ManageGuild),
	async run(client: Ryneczek, interaction: CommandInteraction) {
		// @ts-ignore
		if(!interaction.member.roles.cache.has('811550637518487563')) return interaction.reply({ content: 'Nie masz uprawnień do tej komendy!', ephemeral: true });
		await interaction.deferReply();

		const rest = new REST({ version: '10' }).setToken(client.config.token);

		await rest.put(
			Routes.applicationGuildCommands(client.user.id, '811550188823904277'),
			// @ts-ignore
			{ body: [...client.commands.values(), ...client.commands.filter(x => x.context).map(x => x.context)] },
		);

		await interaction.editReply({ content: 'Pomyslnie zaktualizowano slashcommands!' });
	},
};