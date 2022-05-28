import { Client, Collection, IntentsBitField } from 'discord.js';
// @ts-ignore
import config from './../../config.json';

import { CommandHandler } from '@classes/Handlers/CommandHandler';
import EventHandler from '@classes/Handlers/EventHandler';
import { Config } from 'types/Config';
import { InteractionHandler } from '@classes/Handlers/InteractionHandler';

const durations = {
	ms: 1,
	s: 1000,
	m: 60 * 1000,
	h: 60 * 60 * 1000,
	d: 24 * 60 * 60 * 1000,
	w: 7 * 24 * 60 * 60 * 1000,
	mo: 30 * 24 * 60 * 60 * 1000,
	y: 365.25 * 24 * 60 * 60 * 1000,
};

export default class Ryneczek extends Client {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	commands: Collection<string, any>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interactions: Collection<string, any>;
	config: Config;
	constructor() {
		super({
			intents: [
				IntentsBitField.Flags.Guilds,
				IntentsBitField.Flags.GuildMessages,
				IntentsBitField.Flags.GuildMembers,
				IntentsBitField.Flags.GuildBans,
				IntentsBitField.Flags.MessageContent,
				IntentsBitField.Flags.DirectMessages,
			],
			allowedMentions: {
				repliedUser: false,
				users: [],
				parse: [],
				roles: [],
			},
		});

		this.commands = new Collection();
		this.interactions = new Collection();

		this.config = config;
	}

	async init(): Promise<void> {
		this.login(this.config.token).then(() => null);

		this.commands = await new CommandHandler(this).loadCommands();
		this.interactions = await new InteractionHandler(this).loadInteractions();

		new EventHandler(this).loadEvents().then(() => null);
	}

	ms(time = undefined): number {
		if(!time) return undefined;

		if(typeof time !== 'string') throw new Error('Time is not a string!');

		time = this.chunk(time.split(/(\d+)(mo|[smhdyw])/gmi).filter(e => e), 2);

		let ms = 0;

		for(const array of time) {
			ms += durations[array[1] || 's'] * array[0];
		}

		if(isNaN(ms)) return undefined;

		return ms;
	}

	chunk(array, size): string[] {
		const arr = [];
		for (let i = 0; i < array.length; i += size) arr.push(array.slice(i, i + size));
		return arr;
	}
}