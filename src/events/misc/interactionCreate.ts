import { Interaction } from "discord.js";
import Ryneczek from "#client";

const commandsHandler = (interaction, client: Ryneczek) => {
	const command = client.commands.get(interaction.commandName);

	if (!command) {
		return interaction.reply({
			content: "Coś poszło nie tak!",
			flags: 64,
		});
	}

	command.run(client, interaction);
};

const otherInteractions = (interaction, client: Ryneczek) => {
	const int = client.interactions.get(
		interaction.customId?.split("_")?.at(0) || interaction?.commandName,
	);

	if ((!int || !int.run) && !interaction.isModalSubmit()) {
		return interaction.reply({
			content: "Coś poszło nie tak!",
			flags: 64,
		});
	}

	int?.run(client, interaction);
};

export async function run(client: Ryneczek, interaction: Interaction) {
	if (interaction.isCommand() || interaction.isContextMenuCommand()) {
		commandsHandler(interaction, client);
	} else {
		otherInteractions(interaction, client);
	}
}
