import type { ParsedMail } from "mailparser";
import { TransferData } from "#types/Agents";

export default abstract class IceHost {
	static parseMail = async (
		mail: ParsedMail,
	): Promise<TransferData | undefined> => {
		if (
			!mail.subject ||
			mail.subject !== "Potwierdzenie transferu środków wirtualnych IceHost.pl"
		) {
			return undefined;
		}
		const content = mail.html;
		if (!content) {
			throw new Error("Received new IceHost mail with no content");
		}
		const transferUrl = content.match(
			/https:\/\/dash\.icehost\.pl\/api\/client\/shop\/payment\/transfer-wpln\/[0-9a-f-]+\/confirm\?signature=[0-9a-f]+/,
		)?.[0];
		if (!transferUrl) {
			throw new Error(
				"Failed to parse IceHost transfer data from notification",
			);
		}
		return {
			provider: "icehost",
			account: "unknown",
			amount: 0,
			acceptUrl: transferUrl,
		};
	};
}
