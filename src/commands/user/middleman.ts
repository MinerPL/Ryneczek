import {
	ChatInputCommandInteraction,
	ContainerBuilder,
	MessageFlags,
	SlashCommandBuilder,
	TextDisplayBuilder,
} from "discord.js";
import Ryneczek from "#client";

export const data = {
	...new SlashCommandBuilder()
		.setName("middleman")
		.setDescription("Jak działa middleman?")
		.setContexts(0)
		.toJSON(),
};

export async function run(
	_client: Ryneczek,
	interaction: ChatInputCommandInteraction,
) {
	await interaction.reply({
		components: [
			new ContainerBuilder().addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`## Jak działa zakup za pośrednictwem middleman:\n\n1. Obie strony potwierdzają chęć dokonania transakcji.\n2. Do zgłoszenia przypisywany jest administrator, który będzie pośredniczył płatność.\n3. Sprzedający przelewa środki na __konto podane przez administratora__.\n4. Po potwierdzeniu przez administratora, kupujący dokonuje płatności __bezpośrednio do sprzedawcy__.\n5. Sprzedawca potwierdza otrzymanie środków.\n6. Administrator przelewa środki na konto kupującego.\n\nJeżeli którakolwiek ze stron, nie zgadza się na ten sposób przeprowadzenia płatności, należy zamknąć zgłoszenie.\n\n**Usługa Middleman jest w pełni darmowa!**`,
				),
			),
		],
		flags: MessageFlags.IsComponentsV2,
	});
}
