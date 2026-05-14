import Ryneczek from "#client";
import {ParsedMail} from "mailparser";
import SkillHost from "#agents/skillhost";
import IceHost from "#agents/icehost";
import {TransferData} from "#types/Agents";
import {
  ActionRowBuilder,
  BaseGuildTextChannel,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder
} from "discord.js";

export async function run(client: Ryneczek, mail: ParsedMail) {
  let transferData: TransferData;
  switch (mail.from?.text.toLowerCase()) {
    case 'SkillHost@skillhost.pl'.toLowerCase():
      transferData = await SkillHost.parseMail(mail);
      break;
    case '"IceHost.pl - Bezpieczny Hosting Gier" <no-reply@icehost.pl>'.toLowerCase():
      transferData = await IceHost.parseMail(mail);
      break;
  }

  if (!transferData) return;

  const notifyChannel = (await client.channels
    .fetch(client.config.notify_channel)
    .catch(() => null)) as BaseGuildTextChannel | null;

  const textDisplay = new TextDisplayBuilder()
    .setContent(`Nowy transfer środów **${transferData.provider.toUpperCase()}**`)
  const container = new ContainerBuilder()
    .addSectionComponents(
      new SectionBuilder()
        .setThumbnailAccessory(
          new ThumbnailBuilder()
            .setURL(notifyChannel.guild.iconURL())
        )
        .addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent(`🚀 Rozpoczęto nowy transfer wychodzący do konta \`${transferData.account}\` na kwotę **${transferData.amount} wPLN**.\n> W celu zakończenia transakcji, kliknij w poniższy przycisk.\n\n*Jeżeli ten transfer nie został zlecony przez administratora, natychmiast to zgłoś.*`)
        )
    )
  const actionRow = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setURL(transferData.acceptUrl)
        .setLabel("Zaakceptuj transfer")
    )

  await notifyChannel.send({
    components: [textDisplay, container, actionRow],
    flags: MessageFlags.IsComponentsV2,
  })
}
