export interface Channel {
    id: string,
    slowmode?: string,
    deletionTime?: string,
    maxOfferts?: number,
    clear?: boolean
    autoPublish?: boolean
}

export interface Config {
    token: string,
    channels: Channel[],
    suggestions: string
}