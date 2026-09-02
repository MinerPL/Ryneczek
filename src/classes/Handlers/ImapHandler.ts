// noinspection JSUnusedGlobalSymbols

import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import Ryneczek from "#client";

const MAX_RECONNECT_DELAY = 5 * 60 * 1000;
const DEFAULT_RECONNECT_DELAY = 15_000;

export default class ImapHandler {
	client: Ryneczek;
	imap: ImapFlow | null = null;
	private closed = false;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	private reconnectAttempts = 0;

	constructor(client: Ryneczek) {
		this.client = client;
	}

	private get autoReconnect(): boolean {
		return this.client.config.imap.autoReconnect !== false;
	}

	private get reconnectDelay(): number {
		return this.client.config.imap.reconnectDelay ?? DEFAULT_RECONNECT_DELAY;
	}

	private createClient(): ImapFlow {
		if (this.imap) {
			const previous = this.imap;
			this.imap = null;
			previous.removeAllListeners();
			try {
				previous.close();
			} catch {
				// Connection is already gone.
			}
		}

		const imap = new ImapFlow({
			host: this.client.config.imap.host,
			port: this.client.config.imap.port,
			auth: {
				user: this.client.config.imap.user,
				pass: this.client.config.imap.pass,
			},
			secure: this.client.config.imap.tls,
			logger: false,
		});

		imap.on("error", (error) => {
			if (this.imap !== imap) {
				return;
			}
			console.error("IMAP error:", error);
		});

		imap.on("close", () => {
			if (this.imap !== imap || this.closed) {
				return;
			}
			console.error("IMAP connection closed.");
			this.scheduleReconnect();
		});

		this.imap = imap;
		return imap;
	}

	start = async () => {
		await this.connectAndListen();
	};

	private connectAndListen = async () => {
		if (this.closed) {
			return;
		}

		try {
			const imap = this.createClient();
			await imap.connect();
			const lock = await imap.getMailboxLock("INBOX");
			try {
				if (!imap.mailbox) {
					return;
				}
				imap.on("exists", this.onExists);
				this.reconnectAttempts = 0;
				console.log("IMAP connected.");
			} finally {
				lock.release();
			}
		} catch (error) {
			console.error("IMAP connection failed:", error);
			this.scheduleReconnect();
		}
	};

	private onExists = async (data: { count: number; prevCount: number }) => {
		const imap = this.imap;
		if (!imap) {
			return;
		}

		const lock = await imap.getMailboxLock("INBOX");
		try {
			if (!imap.mailbox) {
				return;
			}
			const newCount = data.count - data.prevCount;
			const messages = await imap.fetchAll(
				`${imap.mailbox.exists - newCount + 1}:*`,
				{ envelope: true, source: true },
			);
			for (const message of messages) {
				if (!message.source) {
					continue;
				}
				const parsedMail = await simpleParser(message.source);
				this.client.emit("mail", parsedMail);
			}
		} finally {
			lock.release();
		}
	};

	private scheduleReconnect() {
		if (this.closed || !this.autoReconnect || this.reconnectTimer) {
			return;
		}

		const delay = Math.min(
			this.reconnectDelay * 2 ** this.reconnectAttempts,
			MAX_RECONNECT_DELAY,
		);
		this.reconnectAttempts += 1;

		console.log(
			`IMAP reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}).`,
		);

		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = null;
			this.connectAndListen().then(() => null);
		}, delay);
	}

	close = async () => {
		this.closed = true;
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}

		const imap = this.imap;
		this.imap = null;
		if (!imap) {
			return;
		}

		try {
			await imap.logout();
		} catch {
			imap.close();
		}
	};
}
