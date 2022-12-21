export interface Channel {
    id: string,
    clear?: boolean
    autoPublish?: boolean
}

export interface Config {
    token: string,
    channels: Channel[],
    suggestions: string
    logs: string;
    moderation_alerts: string;
}