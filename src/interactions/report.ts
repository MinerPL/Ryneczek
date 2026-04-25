import { ExportReturnType, createTranscript } from "discord-html-transcripts";
import {
	ActionRowBuilder,
	BaseGuildTextChannel,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChannelType,
	ComponentType,
	ForumChannel,
	ForumThreadChannel,
	GuildMemberRoleManager,
	ModalSubmitFields,
	PermissionFlagsBits,
} from "discord.js";
import Ryneczek from "#client";
import { buildReportModal, publishReport } from "#functions/reportFlow";

const caseChannelLocks = new Map<string, Promise<void>>();

async function withCaseChannelLock<T>(caseId: string, task: () => Promise<T>) {
	const previous = caseChannelLocks.get(caseId) ?? Promise.resolve();
	let release!: () => void;
	const next = new Promise<void>((resolve) => {
		release = resolve;
	});
	const current = previous.then(() => next);
	caseChannelLocks.set(caseId, current);

	await previous;
	try {
		return await task();
	} finally {
		release();
		if (caseChannelLocks.get(caseId) === current) {
			caseChannelLocks.delete(caseId);
		}
	}
}

async function removeDecisionButtons(interaction: ButtonInteraction) {
	const componentsWithoutDecisionButtons = interaction.message.components.filter(
		(component) => {
			if (component.type !== ComponentType.ActionRow) {
				return true;
			}

			return !component.components.some(
				(rowComponent) =>
					rowComponent.type === ComponentType.Button &&
					((rowComponent.customId || "").startsWith("report_accept_") ||
						(rowComponent.customId || "").startsWith("report_reject_")),
			);
		},
	);

	await interaction.message
		.edit({ components: componentsWithoutDecisionButtons as any })
		.catch(() => null);
}

function buildCaseCloseActionRow() {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId("report_caseclose")
			.setLabel("Zamknij sprawę")
			.setStyle(ButtonStyle.Secondary),
	);
}

async function resolveCaseTextChannel(
	guild: NonNullable<ButtonInteraction["guild"]>,
	channelId: string | null | undefined,
	channelName: string,
) {
	if (channelId) {
		const byId = await guild.channels.fetch(channelId).catch(() => null);
		if (byId?.type === ChannelType.GuildText) {
			return byId as BaseGuildTextChannel;
		}
	}

	const cached = guild.channels.cache.find(
		(channel) =>
			channel.type === ChannelType.GuildText && channel.name === channelName,
	);
	if (cached?.type === ChannelType.GuildText) {
		return cached as BaseGuildTextChannel;
	}

	const fetched = await guild.channels.fetch().catch(() => null);
	const byName = fetched?.find(
		(channel) =>
			channel?.type === ChannelType.GuildText && channel.name === channelName,
	);

	return byName?.type === ChannelType.GuildText
		? (byName as BaseGuildTextChannel)
		: null;
}

async function createCaseTextChannel(
	client: Ryneczek,
	interaction: ButtonInteraction,
	channelName: string,
	allowedUserId: string,
	introContent: string,
	reason: string,
) {
	if (!interaction.guild) {
		return null;
	}

	const channel = await interaction.guild.channels.create({
		name: channelName,
		type: ChannelType.GuildText,
		parent: client.config.ticket_category,
		permissionOverwrites: [
			{
				id: interaction.guild.roles.everyone.id,
				deny: [PermissionFlagsBits.ViewChannel],
			},
			{
				id: client.config.admin_role,
				allow: [
					PermissionFlagsBits.ViewChannel,
					PermissionFlagsBits.SendMessages,
					PermissionFlagsBits.ReadMessageHistory,
					PermissionFlagsBits.EmbedLinks,
					PermissionFlagsBits.AttachFiles,
				],
			},
			{
				id: allowedUserId,
				allow: [
					PermissionFlagsBits.ViewChannel,
					PermissionFlagsBits.SendMessages,
					PermissionFlagsBits.ReadMessageHistory,
					PermissionFlagsBits.EmbedLinks,
					PermissionFlagsBits.AttachFiles,
				],
			},
		],
		reason,
	});

	await channel.send({
		content: introContent,
		components: [buildCaseCloseActionRow()],
	});

	return channel;
}

async function resolveArchiveTarget(
	client: Ryneczek,
	interaction: ButtonInteraction,
	caseId: string,
	logChannelId: string,
) {
	const reportChannel = (await client.channels
		.fetch(client.config.report_channel)
		.catch(() => null)) as BaseGuildTextChannel | ForumChannel | null;

	if (!reportChannel) {
		return null;
	}

	const logChannel = await interaction.guild.channels
		.fetch(logChannelId)
		.catch(() => null);

	if (reportChannel instanceof ForumChannel) {
		if (
			logChannel?.isThread?.() &&
			logChannel.parentId === reportChannel.id &&
			logChannel.parent?.type === ChannelType.GuildForum
		) {
			return logChannel;
		}

		return reportChannel.threads.create({
			name: `Archiwum zgłoszenia ${caseId}`,
			autoArchiveDuration: 10080,
			reason: `Archiwum rozmowy w sprawie zgłoszenia ${caseId}`,
			message: {
				content: `Archiwum rozmowy dla sprawy **${caseId}**`,
			},
		});
	}

	if (!("threads" in reportChannel)) {
		return null;
	}

	if (
		logChannel?.isThread?.() &&
		logChannel.parentId === reportChannel.id &&
		logChannel.isTextBased() &&
		!logChannel.isDMBased()
	) {
		return logChannel;
	}

	const threadName = `report-case-${caseId}`;
	const activeThreads = await reportChannel.threads.fetchActive().catch(() => null);
	const existingThread = activeThreads?.threads.find(
		(thread) => thread.name === threadName,
	);

	if (existingThread) {
		return existingThread;
	}

	const starterMessage = await reportChannel.send({
		content: `Archiwum rozmowy dla sprawy **${caseId}**`,
	});
	return starterMessage.startThread({
		name: threadName,
		autoArchiveDuration: 10080,
		reason: `Archiwum rozmowy w sprawie zgłoszenia ${caseId}`,
	});
}

async function ensureCaseChannels(
	client: Ryneczek,
	interaction: ButtonInteraction,
	caseId: string,
	reportedId: string,
	reporterId: string,
	target: "reported" | "reporter" | "both" = "both",
) {
	return withCaseChannelLock(caseId, async () => {
		if (!interaction.guild) {
			return null;
		}

		const reportCase = await client.prisma.reportCases
			.findFirst({ where: { caseRef: caseId } })
			.catch(() => null);

		const reportedUser =
			client.users.cache.get(reportedId) ||
			(await client.users.fetch(reportedId).catch(() => null));
		const reporterUser =
			client.users.cache.get(reporterId) ||
			(await client.users.fetch(reporterId).catch(() => null));

		if (!reportedUser || !reporterUser) {
			return null;
		}

		const shouldEnsureReported = target === "reported" || target === "both";
		const shouldEnsureReporter = target === "reporter" || target === "both";
		const reportedChannelName = `report-${caseId}-oskarzony`;
		const reporterChannelName = `report-${caseId}-zglaszajacy`;

		let reportedChannel = await resolveCaseTextChannel(
			interaction.guild,
			reportCase?.reportedChannelId,
			reportedChannelName,
		);
		let reporterChannel = await resolveCaseTextChannel(
			interaction.guild,
			reportCase?.reporterChannelId,
			reporterChannelName,
		);

		if (shouldEnsureReported && !reportedChannel) {
			reportedChannel = await createCaseTextChannel(
				client,
				interaction,
				reportedChannelName,
				reportedUser.id,
				`To jest prywatny kanał rozmowy dla zgłoszenia **${caseId}**.\n` +
					`Użytkownik zgłoszony: <@${reportedUser.id}>\n` +
					`Prowadzący sprawę: <@&${client.config.admin_role}>`,
				`Rozmowa zgłoszenia ${caseId} z oskarżonym`,
			);
		}

		if (shouldEnsureReporter && !reporterChannel) {
			reporterChannel = await createCaseTextChannel(
				client,
				interaction,
				reporterChannelName,
				reporterUser.id,
				`To jest prywatny kanał rozmowy dla zgłoszenia **${caseId}**.\n` +
					`Zgłaszający: <@${reporterUser.id}>\n` +
					`Prowadzący sprawę: <@&${client.config.admin_role}>`,
				`Rozmowa zgłoszenia ${caseId} ze zgłaszającym`,
			);
		}

		if ((shouldEnsureReported && !reportedChannel) || (shouldEnsureReporter && !reporterChannel)) {
			return null;
		}

		const nextReportedChannelId = reportedChannel?.id ?? reportCase?.reportedChannelId ?? null;
		const nextReporterChannelId = reporterChannel?.id ?? reportCase?.reporterChannelId ?? null;

		await client.prisma.reportCases.upsert({
			where: {
				caseRef: caseId,
			},
			update: {
				logChannelId: interaction.channel.id,
				reportedId,
				reporterId,
				reportedChannelId: nextReportedChannelId,
				reporterChannelId: nextReporterChannelId,
				closed: false,
				closedBy: null,
				closedAt: null,
			},
			create: {
				caseRef: caseId,
				logChannelId: interaction.channel.id,
				reportedId,
				reporterId,
				reportedChannelId: nextReportedChannelId,
				reporterChannelId: nextReporterChannelId,
			}
		})

		return {
			reportedChannel: reportedChannel?.type === ChannelType.GuildText ? reportedChannel : null,
			reporterChannel: reporterChannel?.type === ChannelType.GuildText ? reporterChannel : null,
		};
	});
}

export async function run(client: Ryneczek, interaction: ButtonInteraction) {
	const action = interaction.customId.split("_")[1];

	if (action === "create") {
		const sellerId = interaction.customId.split("_")[2];
		const buyerId = interaction.customId.split("_")[3];
		const targetUserId = interaction.user.id === sellerId ? buyerId : sellerId;
		const reportedUser =
			client.users.cache.get(targetUserId) ||
			(await client.users.fetch(targetUserId).catch(() => null));

		if (!reportedUser) {
			return interaction.reply({
				content: "Nie udało się pobrać użytkownika do zgłoszenia.",
				flags: 64,
			});
		}

		if (reportedUser.id === interaction.user.id) {
			return interaction.reply({
				content: "Nie możesz zgłosić samego siebie!",
				flags: 64,
			});
		}

		const reportTimestamp = Date.now();
		const reportModal = buildReportModal(`reportmodal_user_${reportTimestamp}`);

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

		const reason = (modalUse.fields as ModalSubmitFields).getTextInputValue(
			"report_reason",
		);
		const explanation = (modalUse.fields as ModalSubmitFields).getTextInputValue(
			"report_explanation",
		);
		const attachments = (modalUse.fields as ModalSubmitFields).getUploadedFiles(
			"report_attachments",
		);
		const transcriptUrl =
			interaction.message.attachments.find((attachment) =>
				attachment.name?.endsWith(".html"),
			)?.url || interaction.message.attachments.first()?.url;

		await publishReport({
			client,
			reportedUser,
			reporterUser: interaction.user,
			reason,
			explanation,
			attachments,
			reportTimestamp,
			transcriptUrl,
		});

		return;
	}

	if (
		!(interaction.member.roles as GuildMemberRoleManager).cache.get(
			client.config.admin_role,
		)
	) {
		return interaction.reply({
			content: "Nie możesz zarządzaj zgłoszeniami!",
			flags: 64,
		});
	}

	if (action === "caseclose") {
		if (interaction.channel.type !== ChannelType.GuildText) {
			return interaction.reply({
				content: "Tę sprawę można zamknąć tylko z kanału tekstowego.",
				flags: 64,
			});
		}

		const reportCase = await client.prisma.reportCases.findFirst({
			where: {
				closed: false,
				OR: [
					{ reportedChannelId: interaction.channel.id },
					{ reporterChannelId: interaction.channel.id },
				],
			},
		});

		if (!reportCase) {
			return interaction.reply({
				content: "Nie znaleziono danych sprawy w tym kanale.",
				flags: 64,
			});
		}

		await interaction.deferReply({ flags: 64 });

		const currentCaseChannel = interaction.channel;
		const transcripts = [];
		const filename = `report-${reportCase.caseRef}-${currentCaseChannel.id}.html`;
		const transcript = await createTranscript(currentCaseChannel as any, {
			returnType: ExportReturnType.Attachment,
			filename,
		}).catch(() => null);
		if (transcript) {
			transcripts.push(transcript);
		}

		const archiveTarget = await resolveArchiveTarget(
			client,
			interaction,
			reportCase.caseRef,
			reportCase.logChannelId,
		);

		if (archiveTarget) {
			await archiveTarget.send({
				content:
					`Archiwum rozmowy zgłoszenia **${reportCase.caseRef}**. Zamknięte przez <@${interaction.user.id}>.`,
				files: transcripts,
			});
		}

		await currentCaseChannel.delete().catch(() => null);

		const reportedStillExists = reportCase.reportedChannelId
			? await interaction.guild.channels
					.fetch(reportCase.reportedChannelId)
					.then((channel) => channel?.type === ChannelType.GuildText)
					.catch(() => false)
			: false;
		const reporterStillExists = reportCase.reporterChannelId
			? await interaction.guild.channels
					.fetch(reportCase.reporterChannelId)
					.then((channel) => channel?.type === ChannelType.GuildText)
					.catch(() => false)
			: false;

		await client.prisma.reportCases.update({
			where: {
				id: reportCase.id,
			},
			data: {
				closed: !reportedStillExists && !reporterStillExists,
				closedBy:
					!reportedStillExists && !reporterStillExists
						? interaction.user.id
						: null,
				closedAt:
					!reportedStillExists && !reporterStillExists ? new Date() : null,
			},
		});

		return;
	}

	if (action === "open") {
		const openTarget = interaction.customId.split("_")[2];
		const caseId = interaction.customId.split("_")[3];
		const reportedId = interaction.customId.split("_")[4];
		const reporterId = interaction.customId.split("_")[5];

		const channels = await ensureCaseChannels(
			client,
			interaction,
			caseId,
			reportedId,
			reporterId,
			openTarget === "reported" ? "reported" : "reporter",
		);

		if (!channels) {
			return interaction.reply({
				content: "Nie udało się utworzyć lub pobrać kanałów sprawy.",
				flags: 64,
			});
		}

		const targetChannel =
			openTarget === "reported"
				? channels.reportedChannel
				: channels.reporterChannel;

		if (!targetChannel) {
			return interaction.reply({
				content: "Nie udało się znaleźć docelowego kanału sprawy.",
				flags: 64,
			});
		}

		return interaction.reply({
			content: `Kanał sprawy: <#${targetChannel.id}>`,
			flags: 64,
		});
	}

	if (!["accept", "reject"].includes(action)) {
		return;
	}

	await removeDecisionButtons(interaction);

	const caseId = interaction.customId.split("_")[2];
	const reportedId = interaction.customId.split("_")[3];
	const reporterId = interaction.customId.split("_")[4];

	if (action === "accept") {
		if (!interaction.guild) {
			return interaction.reply({
				content: "Nie udało się pobrać serwera dla tej interakcji.",
				flags: 64,
			});
		}

		const channels = await ensureCaseChannels(
			client,
			interaction,
			caseId,
			reportedId,
			reporterId,
		);

		if (!channels) {
			return interaction.reply({
				content:
					"Nie udało się utworzyć kanałów sprawy lub zapisać danych w bazie.",
				flags: 64,
			});
		}

		await interaction.channel.send({
			content:
				`Utworzono kanały rozmowy dla sprawy **${caseId}**:\n` +
				`- Oskarżony: <#${channels.reportedChannel.id}>\n` +
				`- Zgłaszający: <#${channels.reporterChannel.id}>`,
		});

		await interaction.reply({
			content:
				"Zgłoszenie zostało zaakceptowane. Utworzono oddzielne kanały rozmowy i ukryto przyciski decyzji.",
			flags: 64,
		});

		if (interaction.channel.parent instanceof ForumChannel) {
			const acceptTag = interaction.channel.parent.availableTags.find(
				(tag) => tag.emoji.name === "✅",
			);
			if (acceptTag) {
				await (interaction.channel as ForumThreadChannel).edit({
					appliedTags: [acceptTag.id],
				});
			}
		}
	} else {
		await interaction.channel.send({
			content: `Odrzucone przez: <@${interaction.user.id}> (${interaction.user.username})`,
		});
		if (interaction.channel.parent instanceof ForumChannel) {
			const rejectTag = interaction.channel.parent.availableTags.find(
				(tag) => tag.emoji.name === "❌",
			);
			if (rejectTag) {
				await (interaction.channel as ForumThreadChannel).edit({
					appliedTags: [rejectTag.id],
				});
			}
		}
		await interaction.reply({
			content: "Zgłoszenie zostało odrzucone, a przyciski decyzji usunięto.",
			flags: 64,
		});
	}
}
