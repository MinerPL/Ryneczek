import {
	ButtonInteraction,
	ContainerBuilder,
	ContainerComponent,
	GuildMember,
	MessageFlags,
	TextDisplayBuilder,
} from "discord.js";
import Ryneczek from "#client";

export async function run(client: Ryneczek, interaction: ButtonInteraction) {
	await interaction.reply({
		components: [
			new TextDisplayBuilder().setContent(`<@&${client.config.admin_role}>`),
			new ContainerBuilder().addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`<@${
						(interaction.member as GuildMember).id
					}> chciałby przeprowadzić tę transakcję za pośrednictwem tzw. middlemana!\n\n**Proces zakupu**\n1. Obie strony potwierdzają chęć dokonania transakcji.\n2. Do zgłoszenia przypisywany jest administrator, który będzie pośredniczył płatność.\n3. Sprzedający przelewa środki na __konto podane przez administratora__.\n4. Po potwierdzeniu przez administratora, kupujący dokonuje płatności __bezpośrednio do sprzedawcy__.\n5. Sprzedawca potwierdza otrzymanie środków.\n6. Administrator przelewa środki na konto kupującego.\n\nJeżeli którakolwiek ze stron, nie zgadza się na ten sposób przeprowadzenia płatności, należy zamknąć zgłoszenie.`,
				),
			),
		],
		flags: MessageFlags.IsComponentsV2,
		allowedMentions: {
			roles: [client.config.admin_role],
		},
	});

	const components = interaction.message.components[0] as ContainerComponent;

	components.components.forEach((component) => {
		if (component.type === 1) {
			if (
				component.components.find((c) => c.customId === "request_middleman")
			) {
				component.components.find(
					(c) => c.customId === "request_middleman",
					// @ts-expect-error
				)!.data.disabled = true;
			}
		}
	});

	interaction.message.edit({ components: [components] }).catch(() => null);
}
