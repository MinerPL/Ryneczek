import {
	ChatInputCommandInteraction,
	ContainerBuilder,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
	TextDisplayBuilder,
} from "discord.js";
import Ryneczek from "#client";

export const data = {
	...new SlashCommandBuilder()
		.setName("accounts")
		.setDescription("Wysyła informacje o koncie Middleman")
		.setContexts(0)
		.addStringOption((option) =>
			option
				.setName("hosting")
				.setDescription("Hosting do którego chcesz wysłać informacje")
				.setRequired(true)
				.addChoices(
					{ name: "SkillHost", value: "skillhost" },
					{ name: "IceHost", value: "icehost" },
				),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.toJSON(),
};

const accounts = {
	skillhost: "12556",
	icehost: "ryneczek@minerpl.xyz",
};

export async function run(
	_client: Ryneczek,
	interaction: ChatInputCommandInteraction,
) {
	const hosting = interaction.options.getString("hosting", true);

	const container = new ContainerBuilder().addTextDisplayComponents(
		new TextDisplayBuilder().setContent(
			`W celu skorzystania z usługi Middleman środki należy przelać na konto o ID/Mailu \`${accounts[hosting]}\` w serwisie ${hosting}.`,
		),
	);

	await interaction.reply({
		components: [container],
		flags: MessageFlags.IsComponentsV2,
	});
}
