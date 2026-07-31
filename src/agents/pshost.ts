import type { ParsedMail } from "mailparser";
import { IncomingData } from "#types/Agents";
import {TransferData} from "../types/Agents.js";

export default abstract class PsHost {
	static parseIncomingMail = async (
		mail: ParsedMail,
	): Promise<IncomingData | undefined> => {
		const content = JSON.stringify(mail.text);
		if (!content) {
			throw new Error("Received new psHost mail with no content");
		}
    const incomingData = content.match(/kwoty\s+(\d+)\s+wPLN.*?użytkownika\\n(\S+)\./);
    if (!incomingData) {
      throw new Error(
        "Failed to parse psHost incoming data from notification",
      );
    }
    const amount = parseFloat(incomingData[1]);
    const account = incomingData[2];
    if (!amount || !account) {
      throw new Error(
        "Failed to parse psHost transfer data from notification",
      );
    }
		return {
			provider: "pshost",
			account,
			amount,
		};
	};

  static parseTransferMail = async (
    mail: ParsedMail,
  ): Promise<TransferData | undefined> => {
    const content = JSON.stringify(mail.text);
    if (!content) {
      throw new Error("Received new psHost mail with no content");
    }
    const incomingData = content.match(/kwoty\s+(\d+)\s+wPLN.*?użytkownika.*?\\n\((\S+)\)/);
    if (!incomingData) {
      throw new Error(
        "Failed to parse psHost incoming data from notification",
      );
    }
    const amount = parseFloat(incomingData[1]);
    const account = incomingData[2];
    const acceptUrl = content.match(
      /\[(https:\/\/panel\.pshost\.pl\/wallet\/transferConfirm.*?)]/,
    )[1];
    if (!amount || !account || !acceptUrl) {
      throw new Error(
        "Failed to parse psHost transfer data from notification",
      );
    }
    return {
      provider: "pshost",
      account,
      amount,
      acceptUrl,
    };
  };
}
