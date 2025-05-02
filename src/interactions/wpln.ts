import Ryneczek from "#client";
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    MessageFlags,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    TextDisplayBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";

export async function run(client: Ryneczek, interaction: AnySelectMenuInteraction) {
    const hosting = interaction.values?.at(0);

    if (!hosting) {
        return interaction.reply({
            content: "Nie wybrano hostingu!",
            flags: 64,
        });
    }

    const modal = new ModalBuilder()
        .setTitle(`Oferta ${hosting}`)
        .setCustomId(`offer_${hosting}`)
        .addComponents(
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('count')
                    .setPlaceholder('Ilość wPLN (np. 1000)')
                    .setLabel('Ilość wPLN')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true),
            ),
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('exchange')
                    .setPlaceholder('Kurs sprzedaży wPLN (np. 2.00 lub 0.5)')
                    .setLabel('Kurs')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true),
            ),
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('methods')
                    .setPlaceholder('Metody płatności (np. Przelew, PayPal, Revolut)')
                    .setLabel('Metody płatności')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true),
            ),
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                new TextInputBuilder()
                    .setCustomId('additional_information')
                    .setPlaceholder('Dodatkowe informacje (np. Wymagania, inne)')
                    .setLabel('Dodatkowe informacje')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false),
            )
        ).toJSON()

    const response = await client.useModal(
        interaction,
        modal,
        client.ms("5m"),
    );

    if (isNaN(Number(response.fields.getField('exchange').value)) || isNaN(Number(response.fields.getField('count').value))) {
        return response.reply({
            content: "Kurs i ilość muszą być liczbami!",
            flags: 64,
        });
    }

    const exchange = response.fields.getField('exchange').value;
    let oldExchange: number;
    let newExchange: number;
    if (exchange < 1) {
        oldExchange = Number(exchange);
        newExchange = Number((1 / Number(exchange)).toFixed(2));
    } else {
        newExchange = Number(exchange);
        oldExchange = Number((1 / Number(exchange)).toFixed(2));
    }

    const container = new ContainerBuilder()
        .addTextDisplayComponents([
            new TextDisplayBuilder()
                .setContent(`**Sprzedający:** ${response.user} (${response.user.username})
**Hosting:** ${hosting}
**Kurs:** ${newExchange}/${oldExchange} -> 1zł = ${newExchange}wPLN
**Ilość:** ${response.fields.getField('count').value}
**Metody płatności:** ${response.fields.getField('methods').value}

**Dodatkowe informacje:** ${response.fields.getField('additional_information')?.value || 'Brak'}
`)
        ])
        .addSeparatorComponents(
            new SeparatorBuilder()
                .setDivider(true)
                .setSpacing(SeparatorSpacingSize.Small)
        )
        .addActionRowComponents(
            new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Oznacz jako sprzedane')
                        .setStyle(ButtonStyle.Success)
                        .setCustomId('e10d359d609348bac40a33e1c53ac864'),
                    new ButtonBuilder()
                        .setLabel('Chcę kupić!')
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId('88deec7ddaba4611ba8b77be44ee9a10'),
                    new ButtonBuilder()
                        .setLabel('Zmień ilość')
                        .setStyle(ButtonStyle.Secondary)
                        .setCustomId('224ddc438ed14205ba7f23a4fe9c8fd5'),
                )
        )

    await interaction.message.edit({ components: interaction.message.components, flags: MessageFlags.IsComponentsV2 })

    await response.reply({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
    })
}
