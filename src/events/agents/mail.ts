import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	MessageFlags,
	SectionBuilder,
	TextChannel,
	TextDisplayBuilder,
	ThumbnailBuilder,
} from "discord.js";
import { ParsedMail } from "mailparser";
import IceHost from "#agents/icehost";
import SkillHost from "#agents/skillhost";
import Ryneczek from "#client";
import { TransferData } from "#types/Agents";
import PsHost from "#agents/pshost";
import {IncomingData} from "../../types/Agents.js";

export async function run(client: Ryneczek, mail: ParsedMail) {
	switch (mail.from?.text.toLowerCase()) {
		case "SkillHost@skillhost.pl".toLowerCase(): {
      if (mail?.subject !== "Transfer środków - SkillHost.PL") {
        break;
      }
			const transferData = await SkillHost.parseTransferMail(mail);
      await handleTransfer(client, transferData);
			break;
		}
		case '"IceHost.pl - Bezpieczny Hosting Gier" <no-reply@icehost.pl>'.toLowerCase(): {
      if (mail?.subject !== "Potwierdzenie transferu środków wirtualnych IceHost.pl") {
        break;
      }
			const transferData = await IceHost.parseTransferMail(mail);
      await handleTransfer(client, transferData);
			break;
		}
    case '"psHost.pl" <noreply@pshost.pl>'.toLowerCase(): {
      switch (mail.subject.toLowerCase()) {
        case 'Otrzymałeś przelew środków - psHost.pl'.toLowerCase(): {
          const incomingData = await PsHost.parseIncomingMail(mail);
          await handleIncoming(client, incomingData);
          break;
        }
        case 'Wymagana akcja: Potwierdź przelew środków - psHost.pl'.toLowerCase(): {
          const transferData = await PsHost.parseTransferMail(mail);
          await handleTransfer(client, transferData);
          break;
        }
      }
    }
	}
}

const handleTransfer = async (client: Ryneczek, transferData: TransferData) => {
  if (!transferData) {
    return;
  }

  const notifyChannel = client.channels.cache.get(
    client.config.notify_channel,
  ) as TextChannel;

  const textDisplay = new TextDisplayBuilder().setContent(
    `Rozpoczęto transfer środków **${transferData.provider.toUpperCase()}**`,
  );
  const container = new ContainerBuilder().addSectionComponents(
    new SectionBuilder()
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(notifyChannel.guild.iconURL()),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `🚀 Rozpoczęto nowy transfer wychodzący do konta \`${transferData.account}\` na kwotę **${transferData.amount} wPLN**.\n> W celu zakończenia transakcji, kliknij w poniższy przycisk.\n\n*Jeżeli ten transfer nie został zlecony przez administratora, natychmiast to zgłoś.*`,
        ),
      ),
  );
  const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setURL(transferData.acceptUrl)
      .setLabel("Zaakceptuj transfer"),
  );

  await notifyChannel.send({
    components: [textDisplay, container, actionRow],
    flags: MessageFlags.IsComponentsV2,
  });
}

const handleIncoming = async (client: Ryneczek, incomingData: IncomingData) => {
  if (!incomingData) {
    return;
  }

  const notifyChannel = client.channels.cache.get(
    client.config.notify_channel,
  ) as TextChannel;

  const textDisplay = new TextDisplayBuilder().setContent(
    `Otrzymano transfer środków **${incomingData.provider.toUpperCase()}**`,
  );
  const container = new ContainerBuilder().addSectionComponents(
    new SectionBuilder()
      .setThumbnailAccessory(
        new ThumbnailBuilder().setURL(notifyChannel.guild.iconURL()),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `🚀 Otrzymano nowy transfer przychodzący z konta \`${incomingData.account}\` na kwotę **${incomingData.amount} wPLN**.\n> Ta wiadomość jest potwierdzeniem otrzymania środków od użytkownika.\n\n*Jeżeli ten transfer nie może zostać przypiany do żadnego zgłoszenia, natychmiast to zgłoś.*`,
        ),
      ),
  );

  await notifyChannel.send({
    components: [textDisplay, container],
    flags: MessageFlags.IsComponentsV2,
  });
}