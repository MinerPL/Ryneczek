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
	const container = new ContainerBuilder();

	const text =
		new TextDisplayBuilder().setContent(`**Sprzedający:** ${data.OfferDetails?.user ?? "Brak"} (${data.OfferDetails?.user?.username ?? "Brak"})
**Hosting:** ${data.dbHosting?.website ? ` [${data.dbHosting?.name}](${data.dbHosting?.website})` : data.dbHosting?.name}
**Kurs:** 1zł -> ${data.OfferDetails?.newExchange ?? 0}wPLN
**Ilość:** ${data.OfferDetails?.count ?? 0}
**Metody płatności:** ${data.OfferDetails?.methods ?? "Brak"}

**Dodatkowe informacje:** ${data.OfferDetails?.additional_information || "Brak"}
`);

	if (data.dbHosting?.icon) {
		container.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(text)
				.setThumbnailAccessory(
					new ThumbnailBuilder().setURL(data.dbHosting.icon),
				),
		);
	} else {
		container.addTextDisplayComponents(text);
	}
	return container
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
