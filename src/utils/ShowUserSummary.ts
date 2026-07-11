import {
	ContainerBuilder,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
	ThumbnailBuilder,
} from "discord.js";
import Ryneczek from "#classes/Ryneczek";

export async function showUserSummary(
	client: Ryneczek,
	userId: string,
): Promise<ContainerBuilder> {
	const opinions = await client.prisma.opinions.findMany({
		where: {
			user: userId,
		},
	});

	if (!opinions.length) {
		return new ContainerBuilder().addTextDisplayComponents(
			new TextDisplayBuilder().setContent("Brak opinii o użytkowniku"),
		);
	}

	const sales = await client.prisma.offerts.findMany({
		where: {
			userId: userId,
		},
		include: {
			Sales: true,
		},
	});

	let middlemanRequests = 0;
	let totalSales = 0;

	for (const offert of sales) {
		for (const sale of offert.Sales) {
			if (sale.isDone) {
				totalSales++;
				if (sale.middleman) {
					middlemanRequests++;
				}
			}
		}
	}

	if (totalSales === 0) {
		totalSales = 1; // To avoid division by zero
	}

	const positiveOpinions = opinions.filter(
		(opinion) => opinion.positive,
	).length;
	const negativeOpinions = opinions.filter(
		(opinion) => !opinion.positive,
	).length;

	const surveyStats = {
		fast: 0,
		good_contact: 0,
		good_price: 0,
		as_described: 0,
		helpful_seller: 0,
		suspicious_seller: 0,
		long_wait: 0,
		changed_mind: 0,
		wrong_amount: 0,
		rude_seller: 0,
	};

	for (const opinion of opinions) {
		for (const result of opinion.surveyResults as string[]) {
			if (!surveyStats[result]) {
				surveyStats[result] = 0;
			}

			surveyStats[result]++;
		}
	}

	return new ContainerBuilder()
		.addSectionComponents(
			new SectionBuilder()
				.setThumbnailAccessory(
					new ThumbnailBuilder().setURL(
						client.users.cache.get(userId)?.displayAvatarURL() ??
							"https://cdn.discordapp.com/embed/avatars/0.png",
					),
				)
				.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(
						`# Opinie o użytkowniku <@${userId}>`,
					),
				),
		)
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		)
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`## Ogólne statystyki
**Pozytywne:** ${positiveOpinions}
**Negatywne:** ${negativeOpinions}
**Transakcje wykonane przez Middlemana:** ${((middlemanRequests / totalSales) * 100).toFixed(2)}%`),
		)
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setSpacing(SeparatorSpacingSize.Small)
				.setDivider(true),
		)
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(`## Ankieta
**Transakcja była szybka**: ${surveyStats["fast"]}
**Świetny i bezproblemowy kontakt**: ${surveyStats["good_contact"]}
**Atrakcyjny przelicznik**: ${surveyStats["good_price"]}
**Wszystko zgodnie z ustaleniami**: ${surveyStats["as_described"]}
**Sprzedawca był bardzo pomocny**: ${surveyStats["helpful_seller"]}
**Sprzedawca zachowywał się podejrzanie**: ${surveyStats["suspicious_seller"]}
**Długi czas oczekiwania**: ${surveyStats["long_wait"]}
**Próba zmiany ustaleń w trakcie**: ${surveyStats["changed_mind"]}
**Kwota niezgodna z umową**: ${surveyStats["wrong_amount"]}
**Nieprzyjemne zachowanie sprzedawcy**: ${surveyStats["rude_seller"]}`),
		);
}
