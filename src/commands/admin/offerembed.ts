import Ryneczek from "#client";
import {MessageFlags} from "discord-api-types/v10";
import {
    ActionRowBuilder,
    ChatInputCommandInteraction,
    ContainerBuilder,
    GuildMember,
    MessageActionRowComponentBuilder,
    PermissionFlagsBits,
    SelectMenuOptionBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    SlashCommandBuilder,
    StringSelectMenuBuilder, StringSelectMenuOptionBuilder,
    TextDisplayBuilder,
} from "discord.js";

export const data = {
    ...new SlashCommandBuilder()
        .setName("offerembed")
        .setDescription("Embed od wplnów")
        .addChannelOption(option =>
            option.setName("channel")
                .setRequired(true)
                .setDescription("Kanał")
        )
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

    const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("# Kreator oferty")
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("Witaj w kreatorze ofert! Aby utworzyć ofertę **sprzedaży** wPLN należy wybrać hosting z poniższej listy oraz uzupełnić wymagane informacje. \n\n**Uwaga!** Podawanie nieprawdziwych informacji może skutkować permanentnym banem na serwerze.")
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
            )
            .addActionRowComponents(
                new ActionRowBuilder<MessageActionRowComponentBuilder>()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId("wpln")
                            .addOptions(
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Skillhost")
                                    .setEmoji({id: '1009540151590014986'})
                                    .setValue("SkillHost"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("IceHost")
                                    .setEmoji({id: '1344086774871359488'})
                                    .setValue("IceHost"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Hostgier")
                                    .setEmoji({id: '848185895710228490'})
                                    .setValue("HostGier"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Pukawka")
                                    .setEmoji({id: '1344743153927979091'})
                                    .setValue("Pukawka"),
                                new StringSelectMenuOptionBuilder()
                                    .setLabel("Inny")
                                    .setEmoji('❓')
                                    .setValue("Inny"),
                            ),
                    )
            );

    await interaction.reply({ content: "Gotowe.", flags: 64})
    await interaction.followUp({ components: [container], flags: MessageFlags.IsComponentsV2})
}
