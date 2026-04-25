import {
	ChatInputCommandInteraction,
	ModalSubmitFields,
	SlashCommandBuilder,
	User,
} from "discord.js";
import Ryneczek from "#client";
import { buildReportModal, publishReport } from "#functions/reportFlow";

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
	const user = interaction.options.getUser("użytkownik") as User;

	if (user?.id === interaction?.user?.id) {
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

	const reason = (modalUse.fields as ModalSubmitFields).getTextInputValue("report_reason");
	const explanation = (modalUse.fields as ModalSubmitFields).getTextInputValue("report_explanation");
	const attachments = (modalUse.fields as ModalSubmitFields).getUploadedFiles("report_attachments");

	await publishReport({
		client,
		reportedUser: user,
		reporterUser: interaction.user,
		reason,
		explanation,
		attachments,
		reportTimestamp,
	});
}
