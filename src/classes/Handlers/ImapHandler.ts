import Ryneczek from "#client";
import {ImapFlow} from "imapflow";
import {simpleParser} from "mailparser";

export default class ImapHandler {
  client: Ryneczek;
  imap: ImapFlow;
  constructor(client: Ryneczek) {
    this.client = client;
    this.imap = new ImapFlow({
      host: client.config.imap.host,
      port: client.config.imap.port,
      auth: {
        user: client.config.imap.user,
        pass: client.config.imap.pass,
      },
      secure: client.config.imap.tls,
      logger: false,
    })
  }

  start = async () => {
    await this.imap.connect();
    let lock = await this.imap.getMailboxLock('INBOX');
    try {
      if (!this.imap.mailbox) return;
      this.imap.on('exists', async (data) => {
        if (!this.imap.mailbox) return;
        const newCount = data.count - data.prevCount;
        const messages = await this.imap.fetchAll(`${this.imap.mailbox.exists - newCount + 1}:*`, { envelope: true, source: true });
        for (const message of messages) {
          if (!message.source) continue;
          const parsedMail = await simpleParser(message.source);
          this.client.emit("mail", parsedMail);
        }
      });
    } finally {
      lock.release();
    }
  }

  close = async () => {
    await this.imap.logout();
  }
}