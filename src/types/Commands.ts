import Ryneczek from "#client";
import {
	AnySelectMenuInteraction,
	AutocompleteInteraction,
	ButtonInteraction,
	Interaction,
	ModalSubmitInteraction,
	SlashCommandBuilder,
} from "discord.js";

export interface Command {
	data: SlashCommandBuilder;
	run: (client: Ryneczek, interaction: Interaction) => void;
}

export interface InteractionType {
	run: (
		client: Ryneczek,
		interaction:
			| Interaction
			| ButtonInteraction
			| AnySelectMenuInteraction
			| ModalSubmitInteraction
			| AutocompleteInteraction,
	) => void;
}
