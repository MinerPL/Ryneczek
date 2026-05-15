export interface Channel {
	id: string;
	clear?: boolean;
	autoPublish?: boolean;
}

export interface Imap {
	user: string;
	pass: string;
	host: string;
	port: number;
	tls: boolean;
}

export interface Config {
	token: string;
	channels: Channel[];
	suggestions: string;
	logs: string;
	moderation_alerts: string;
	guild_id: string;
	admin_role: string;
	offerts_category: string;
	report_channel: string;
	lockdown_ignored_categories: string[];
	wpln_forum: string;
	ticket_category: string;
	ticket_archive: string;
	imap: Imap;
	notify_channel: string;
}
