import type { ParsedMail } from "mailparser";
import { TransferData } from "#types/Agents";

export default class SkillHost {
	static parseTransferMail = async (
		mail: ParsedMail,
	): Promise<TransferData | undefined> => {
		const content = mail.html;
		if (!content) {
			throw new Error("Received new SkillHost mail with no content");
		}
		const transferData = content.match(/transfer\s+(\d+)\s+wPLN.*?id\s+(\d+)/);
		if (!transferData) {
			throw new Error(
				"Failed to parse SkillHost transfer data from notification",
			);
		}
		const amount = parseFloat(transferData[1]);
		const account = transferData[2];
		const acceptUrl = content.match(
			/https:\/\/panel\.skillhost\.pl\/[^"]*potwierdz_transfer\/[^"]*/,
		)?.[0];
		if (!amount || !account || !acceptUrl) {
			throw new Error(
				"Failed to parse SkillHost transfer data from notification",
			);
		}
		return {
			provider: "skillhost",
			account,
			amount,
			acceptUrl,
		};
	};
}
