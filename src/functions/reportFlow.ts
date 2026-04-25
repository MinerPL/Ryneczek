import {
	ActionRowBuilder,
	BaseGuildTextChannel,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	FileUploadBuilder,
	ForumChannel,
	LabelBuilder,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	MessageFlags,
	ModalBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
	TextInputBuilder,
	TextInputStyle,
	type Attachment,
	type Snowflake,
	type User,
} from "discord.js";
import Ryneczek from "#client";

export function buildReportModal(customId: string) {
	return new ModalBuilder()
		.setTitle("Zgłoś użytkownika")
		.setCustomId(customId)
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
				),
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
				),
		)
		.addLabelComponents(
			new LabelBuilder().setLabel("Dowody").setFileUploadComponent(
				new FileUploadBuilder()
					.setCustomId("report_attachments")
					.setMaxValues(10)
					.setRequired(false),
			),
		)
		.toJSON();
}

type PublishReportOptions = {
	client: Ryneczek;
	reportedUser: User;
	reporterUser: User;
	reason: string;
	explanation: string;
	attachments?: ReadonlyMap<Snowflake, Attachment>;
	reportTimestamp: number;
	transcriptUrl?: string;
};

export async function publishReport({
	client,
	reportedUser,
	reporterUser,
	reason,
	explanation,
	attachments,
	reportTimestamp,
	transcriptUrl,
}: PublishReportOptions) {
	const galleryItems: MediaGalleryItemBuilder[] = [];

	for (const attachment of attachments?.values() ?? []) {
		const contentType = attachment.contentType?.split("/")[0];
		if (contentType !== "image" && contentType !== "video") {
			continue;
		}

		galleryItems.push(
			new MediaGalleryItemBuilder()
				.setURL(attachment.url)
				.setDescription(attachment.name || "Załącznik"),
		);
	}

	const container = new ContainerBuilder()
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`## Zgłoszenie <@${reportedUser.id}> (${reportedUser.username}, ${reportedUser.id})`,
			),
		)
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(
				`Zgłaszający: <@${reporterUser.id}> (${reporterUser.username}, ${reporterUser.id})`,
			),
		)
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		)
		.addTextDisplayComponents(new TextDisplayBuilder().setContent("### Powód"))
		.addTextDisplayComponents(new TextDisplayBuilder().setContent(reason))
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		)
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent("### Uzasadnienie"),
		)
		.addTextDisplayComponents(new TextDisplayBuilder().setContent(explanation));

	if (transcriptUrl) {
		container
			.addSeparatorComponents(
				new SeparatorBuilder()
					.setSpacing(SeparatorSpacingSize.Small)
					.setDivider(true),
			)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`### Transkrypcja\n[Otwórz transkrypt](${transcriptUrl})`,
				),
			);
	}

	if (galleryItems.length > 0) {
		container.addMediaGalleryComponents(
			new MediaGalleryBuilder().addItems(...galleryItems),
		);
	}

	const actionButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setLabel("Przyjmij")
			.setStyle(ButtonStyle.Success)
			.setCustomId(
				`report_accept_${reportTimestamp}_${reportedUser.id}_${reporterUser.id}`,
			),
		new ButtonBuilder()
			.setLabel("Odrzuć")
			.setStyle(ButtonStyle.Danger)
			.setCustomId(
				`report_reject_${reportTimestamp}_${reportedUser.id}_${reporterUser.id}`,
			),
	);

	const openChannelButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setLabel("Kanał: oskarżony")
			.setStyle(ButtonStyle.Secondary)
			.setCustomId(
				`report_open_reported_${reportTimestamp}_${reportedUser.id}_${reporterUser.id}`,
			),
		new ButtonBuilder()
			.setLabel("Kanał: zgłaszający")
			.setStyle(ButtonStyle.Secondary)
			.setCustomId(
				`report_open_reporter_${reportTimestamp}_${reportedUser.id}_${reporterUser.id}`,
			),
	);

	const channel = client.channels.cache.get(
		client.config.report_channel,
	) as BaseGuildTextChannel | ForumChannel;

	if (channel instanceof ForumChannel) {
		await channel.threads.create({
			name: `Zgłoszenie - ${reportedUser.username}`,
			autoArchiveDuration: 1440,
			reason: `Zgłoszenie użytkownika ${reportedUser.username} (${reportedUser.id})`,
			message: {
				flags: MessageFlags.IsComponentsV2,
				components: [container, actionButtons, openChannelButtons],
			},
		});
	} else {
		await channel.send({
			flags: MessageFlags.IsComponentsV2,
			components: [container, actionButtons, openChannelButtons],
		});
	}
}


