import {
	ActionRowBuilder,
	BaseGuildTextChannel,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	ContainerBuilder,
	FileUploadBuilder,
	ForumChannel,
	GuildMember,
	LabelBuilder,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	MessageFlags,
	ModalBuilder,
	ModalSubmitFields,
	SeparatorBuilder,
	SeparatorSpacingSize,
	SlashCommandBuilder,
	TextDisplayBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import Ryneczek from "#client";

export const data = {
	...new SlashCommandBuilder()
		.setName("report")
		.setDescription("Zgłoś użytkownika łamiącego regulamin")
		.addUserOption((option) =>
			option
				.setName("użytkownik")
				.setDescription("Wybierz użytkownika łamiącego regulamin")
				.setRequired(true),
		)
		.setContexts(0)
		.toJSON(),
};

export async function run(
	client: Ryneczek,
	interaction: ChatInputCommandInteraction,
) {
	const user = interaction.options.getMember("użytkownik") as GuildMember;

	if (user.user.id === interaction.user.id) {
		return interaction.reply({
			content: "Nie możesz zgłosić samego siebie!",
			flags: 64,
		});
	}

	const reportTimestamp = Date.now();

	const reportModal = new ModalBuilder()
		.setTitle("Zgłoś użytkownika")
		.setCustomId("reportmodal_user_" + reportTimestamp)
		.addLabelComponents(
			new LabelBuilder()
			.setLabel("Powód zgłoszenia")
		    .setTextInputComponent(
				new TextInputBuilder()
					.setStyle(TextInputStyle.Short)
					.setCustomId("report_reason")
					.setPlaceholder("Podaj powód zgłoszenia")
					.setMinLength(10)
					.setMaxLength(2000)
					.setRequired(true),
			)
		)
		.addLabelComponents(
			new LabelBuilder()
			.setLabel("Uzasadnienie zgłoszenia")
			.setTextInputComponent(
				new TextInputBuilder()
					.setStyle(TextInputStyle.Paragraph)
					.setCustomId("report_explanation")
					.setPlaceholder("Uzasadnij swoje zgłoszenie")
					.setMinLength(10)
					.setMaxLength(4000)
					.setRequired(true),
			)
		)
		.addLabelComponents(
			new LabelBuilder()
			.setLabel("Dowody")
			.setFileUploadComponent(
				new FileUploadBuilder()
				.setCustomId("report_attachments")
				.setMaxValues(10)
				.setRequired(false),
			)
		)
		.toJSON();

	const modalUse = await client.useModal(
		interaction,
		reportModal,
		client.ms("5m"),
	);
	if (!modalUse) {
		return;
	}

	await modalUse.reply({
		content: "Zgłoszenie zostało wysłane!",
		flags: 64,
	});

	const reason = (modalUse.fields as ModalSubmitFields).getTextInputValue("report_reason");
	const explanation = (modalUse.fields as ModalSubmitFields).getTextInputValue("report_explanation");
	const attachments = (modalUse.fields as ModalSubmitFields).getUploadedFiles("report_attachments");

	const galleryItems: MediaGalleryItemBuilder[] = [];

	for(const attachment of attachments.values()) {
		const contentType = attachment.contentType.split("/")[0];
		if(contentType !== "image" && contentType !== "video") continue;

		galleryItems.push(
			new MediaGalleryItemBuilder()
			.setURL(attachment.url)
			.setDescription(attachment.name || "Załącznik")
		);
	}

	const container = new ContainerBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(`## Zgłoszenie <@${user.id}> (${user.user.username}, ${user.id})`),
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("### Powód"),
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(reason),
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent("### Uzasadnienie"),
            )
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(explanation),
            )
            .addSeparatorComponents(
                new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
            );

			if(galleryItems.length > 0) {
				container.addMediaGalleryComponents(
					new MediaGalleryBuilder().addItems(...galleryItems),
				);
			}

	const components = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setLabel("Przyjmij")
			.setStyle(ButtonStyle.Success)
			.setCustomId("report_accept_" + reportTimestamp),
		new ButtonBuilder()
			.setLabel("Odrzuć")
			.setStyle(ButtonStyle.Danger)
			.setCustomId("report_reject_" + reportTimestamp),
	);


	const channel = client.channels.cache.get(
		client.config.report_channel,
	) as BaseGuildTextChannel | ForumChannel;

	if(channel instanceof ForumChannel) {
		await channel.threads.create({
			name: `Zgłoszenie - ${user.user.username}`,
			autoArchiveDuration: 1440,
			reason: `Zgłoszenie użytkownika ${user.user.username} (${user.id})`,
			message: {
				flags: MessageFlags.IsComponentsV2,
				components: [container, components],
			}
		})
	} else {
		await channel.send({ flags: MessageFlags.IsComponentsV2, components: [container, components] });
	}
}
