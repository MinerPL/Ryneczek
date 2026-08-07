import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	ForumChannel,
	GuildTextBasedChannel,
	MessageFlags,
	SeparatorBuilder,
	SeparatorSpacingSize,
	SectionBuilder,
	TextDisplayBuilder,
	ThumbnailBuilder,
	ThreadAutoArchiveDuration,
	ThreadChannel,
} from "discord.js";
import Ryneczek from "#client";

const surveyMapping = {
	fast: "Transakcja była szybka",
	good_contact: "Świetny i bezproblemowy kontakt",
	good_price: "Atrakcyjny przelicznik",
	as_described: "Wszystko zgodnie z ustaleniami",
	helpful_seller: "Sprzedawca był bardzo pomocny",
	suspicious_seller: "Sprzedawca zachowywał się podejrzanie",
	long_wait: "Długi czas oczekiwania",
	changed_mind: "Próba zmiany ustaleń w trakcie",
	wrong_amount: "Kwota niezgodna z umową",
	rude_seller: "Nieprzyjemne zachowanie sprzedawcy",
} as const;

export type OpinionRecord = {
	user: string;
	addedBy: string;
	positive: boolean;
	comment: string | null;
	surveyResults: unknown;
};

function normalizeSurveyResults(surveyResults: unknown) {
	if (!Array.isArray(surveyResults)) {
		return [];
	}

	return surveyResults.filter(
		(result): result is keyof typeof surveyMapping => result in surveyMapping,
	);
}

export function buildOpinionContainer(
	client: Ryneczek,
	opinion: OpinionRecord,
) {
	const surveyResults = normalizeSurveyResults(opinion.surveyResults);

	return new ContainerBuilder()
		.addSectionComponents(
			new SectionBuilder()
				.setThumbnailAccessory(
					new ThumbnailBuilder().setURL(
						client.users.cache.get(opinion.user)?.displayAvatarURL() ??
							"https://cdn.discordapp.com/embed/avatars/0.png",
					),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`Nowa ${opinion.positive ? "pozytywna" : "negatywna"} opinia o <@${opinion.user}>\nDodana przez <@${opinion.addedBy}>`,
					),
				),
		)
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		)
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`## Ankieta
${surveyResults.map((result) => `* ${surveyMapping[result]}`).join("\n")}`),
		)
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		)
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`## Dodatkowy komentarz
\`\`\`
${opinion.comment || "Brak"}
\`\`\``),
		);
}

async function getOrCreateOpinionThread(
	client: Ryneczek,
	channel: ForumChannel,
	userId: string,
) {
	const opinionThread = await client.prisma.profile.findFirst({
		where: {
			userId,
		},
	});

	let userOpinionThread: ThreadChannel | null = opinionThread?.opinionThread
		? await channel.threads.fetch(opinionThread.opinionThread).catch(() => null)
		: null;

	if (!userOpinionThread) {
		const seller = await client.users.fetch(userId).catch(() => null);
		userOpinionThread = await channel.threads.create({
			name: `Opinie użytkownika ${seller?.username || userId}`,
			autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
			reason: "Tworzenie nowego wątku dla opinii użytkownika",
			message: {
				content: `Opinie o użytkowniku <@${userId}>`,
			},
		});

		await client.prisma.profile.upsert({
			where: {
				userId,
			},
			update: {
				opinionThread: userOpinionThread.id,
			},
			create: {
				userId,
				opinionThread: userOpinionThread.id,
			},
		});
	} else {
		await userOpinionThread.setArchived(false).catch(() => null);
		await userOpinionThread.setLocked(false).catch(() => null);
	}

	return userOpinionThread;
}

export async function sendOpinionToConfiguredChannel(
	client: Ryneczek,
	opinion: OpinionRecord,
): Promise<{ messageId: string; channelId: string } | null> {
	const opinionChannel = await client.channels
		.fetch(client.config.public_opinion_channel)
		.catch(() => null);

	if (!opinionChannel) {
		return null;
	}

	const container = buildOpinionContainer(client, opinion);

	if ("isThreadOnly" in opinionChannel && opinionChannel.isThreadOnly()) {
		const thread = await getOrCreateOpinionThread(
			client,
			opinionChannel as ForumChannel,
			opinion.user,
		);

		const sent = await thread.send({
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});

		return { messageId: sent.id, channelId: thread.id };
	}

	if ("send" in opinionChannel) {
		const sent = await (opinionChannel as GuildTextBasedChannel).send({
			components: [container],
			flags: MessageFlags.IsComponentsV2,
		});

		return { messageId: sent.id, channelId: opinionChannel.id };
	}

	return null;
}

export async function sendOpinionForApproval(
	client: Ryneczek,
	opinionId: number,
	opinion: OpinionRecord,
) {
	const moderationChannel = await client.channels
		.fetch(client.config.opinions_validation)
		.catch(() => null);

	if (!moderationChannel || !("send" in moderationChannel)) {
		return false;
	}

	const container = buildOpinionContainer(client, opinion);

	await (moderationChannel as GuildTextBasedChannel).send({
		components: [
			container,
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setLabel("Zatwierdź")
					.setStyle(ButtonStyle.Success)
					.setCustomId(`opinionApprove_${opinionId}`),
				new ButtonBuilder()
					.setLabel("Odrzuć")
					.setStyle(ButtonStyle.Danger)
					.setCustomId(`opinionReject_${opinionId}`),
			),
		],
		flags: MessageFlags.IsComponentsV2,
	});

	return true;
}
