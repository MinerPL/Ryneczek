import Ryneczek from "#client";
import { Routes } from "discord-api-types/v10";
import {
	ChatInputCommandInteraction,
	GuildMember,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";

export const data = {
	...new SlashCommandBuilder()
		.setName("deploy")
		.setDescription("Zaktualizuj slashcommands")
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
	await interaction.deferReply();

	await client.rest.put(
		Routes.applicationGuildCommands(client.user.id, client.config.guild_id),

		{
			body: [
				...client.commands.map((x) => x.data),
				...client.commands
					.filter((x) => x.data.context)
					.map((x) => x.data.context),
			],
		},
	);

	await interaction.editReply({
		content: "Pomyslnie zaktualizowano slashcommands!",
	});
}
