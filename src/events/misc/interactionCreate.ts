import Ryneczek from '@classes/Ryneczek';
import { Interaction } from 'discord.js';

const commandsHandler = (interaction, client: Ryneczek) => {
	const command = client.commands.get(interaction.commandName);

	if(!command) return interaction.reply({ content: 'Coś poszło nie tak!', ephemeral: true });

	command.run(client, interaction);
};

const otherInteractions = (interaction, client: Ryneczek) => {
	client.interactions.get(interaction.customId.split('_')[0])?.run(client, interaction);
};

export async function run(client: Ryneczek, interaction: Interaction) {
	if(interaction.isCommand() || interaction.isContextMenuCommand()) commandsHandler(interaction, client);
	else otherInteractions(interaction, client);

}