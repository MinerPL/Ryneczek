import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	SectionBuilder,
	SeparatorBuilder,
	SeparatorSpacingSize,
	TextDisplayBuilder,
	ThumbnailBuilder,
	User,
} from "discord.js";

interface OfferContainerProps {
	dbHosting: {
		name: string;
		website?: string;
		icon?: string;
	};
	OfferDetails: {
		user: User;
		newExchange: number;
		oldExchange: number;
		methods: string;
		count: number;
		additional_information?: string;
	};
}

export function OfferContainer(data: OfferContainerProps) {
	const section = new SectionBuilder().addTextDisplayComponents(
		new TextDisplayBuilder().setContent(`**Sprzedający:** ${data.OfferDetails.user} (${data.OfferDetails.user.username})
**Hosting:** ${data.dbHosting?.website ? ` [${data.dbHosting?.name}](${data.dbHosting?.website})` : data.dbHosting?.name}
**Kurs:** ${data.OfferDetails.newExchange}/${data.OfferDetails.oldExchange} -> 1zł = ${data.OfferDetails.newExchange}wPLN
**Ilość:** ${data.OfferDetails.count}
**Metody płatności:** ${data.OfferDetails.methods}

**Dodatkowe informacje:** ${data.OfferDetails.additional_information || "Brak"}
`),
	);

	if (data.dbHosting.icon) {
		section.setThumbnailAccessory(
			new ThumbnailBuilder().setURL(data.dbHosting.icon),
		);
	}

	return new ContainerBuilder()
		.addSectionComponents(section)
		.addSeparatorComponents(
			new SeparatorBuilder()
				.setDivider(true)
				.setSpacing(SeparatorSpacingSize.Small),
		)
		.addActionRowComponents(
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setLabel("Oznacz jako sprzedane")
					.setStyle(ButtonStyle.Success)
					.setCustomId("offert_sold"),
				new ButtonBuilder()
					.setLabel("Chcę kupić!")
					.setStyle(ButtonStyle.Primary)
					.setCustomId("offert_buy"),
				new ButtonBuilder()
					.setLabel("Zmień ilość")
					.setStyle(ButtonStyle.Secondary)
					.setCustomId("offert_change"),
			),
		);
}
