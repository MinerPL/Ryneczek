import Ryneczek from "#client";
import {
    BaseGuildTextChannel,
    ChannelType,
    ChatInputCommandInteraction,
    ColorResolvable,
    EmbedBuilder, OverwriteType,
    PermissionFlagsBits,
    SlashCommandBuilder,
} from "discord.js";

export const data = {
    ...new SlashCommandBuilder()
        .setName("lockdown")
        .setDescription("Blokuje możliwość pisania na wszystkich kanałach.")
        .setContexts(0)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .toJSON(),
};

export async function run(
    client: Ryneczek,
    interaction: ChatInputCommandInteraction,
) {
    const categories = interaction.guild.channels.cache
        .filter(channel => channel.type === ChannelType.GuildCategory)
        .filter(category => !client.config.lockdown_ignored_categories.includes(category.id));

    const isLocked = categories.some(category => {
        return category.permissionOverwrites.cache.find(overrite => overrite.type == OverwriteType.Role && overrite.id === interaction.guild.roles.everyone.id)?.deny?.has(PermissionFlagsBits.SendMessages)
    })

    const embed = new EmbedBuilder()
        .setColor(isLocked ? "Green" as ColorResolvable : "Red" as ColorResolvable)
        .setDescription(
            `${isLocked ? "Odblokowano" : "Zablokowano"} możliwość pisania na wszystkich kanałach!`,
        );

    await interaction.deferReply();

    for(const category of categories.values()) {
        await category.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: isLocked,
            AddReactions: isLocked,
            Connect: isLocked,
            SendMessagesInThreads: isLocked,
            CreatePublicThreads: isLocked,
        });
    }

    await interaction.editReply({ embeds: [embed] })
}
