export interface Channel {
	id: string;
	clear?: boolean;
	autoPublish?: boolean;
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
}
