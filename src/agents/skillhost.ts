import type {ParsedMail} from "mailparser";
import {TransferData} from "../types/Agents.js";

export default class SkillHost {
  static parseMail = async (mail: ParsedMail): Promise<TransferData | undefined> => {
    if (!mail.subject || mail.subject !== "Transfer środków - SkillHost.PL") return undefined;
    const content = mail.html;
    if (!content) throw new Error("Received new SkillHost mail with no content");
    const transferData = content.match(/transfer\s+(\d+)\s+wPLN.*?id\s+(\d+)/);
    if (!transferData) throw new Error("Failed to parse SkillHost transfer data from notification");
    const amount = transferData[1];
    const accountId = transferData[2];
    const transferUrl = content.match(/https:\/\/panel\.skillhost\.pl\/[^"]*potwierdz_transfer\/[^"]*/)?.[0];
    if (!amount || !accountId || !transferUrl) throw new Error("Failed to parse SkillHost transfer data from notification");
    return {
      provider: "skillhost",
      account: accountId,
      amount: parseFloat(amount),
      acceptUrl: transferUrl,
    }
  }
}
