import { ChannelType } from "discord-api-types/v10";
import {
	APIModalInteractionResponseCallbackData,
	AnySelectMenuInteraction,
	BaseGuildTextChannel,
	ButtonInteraction,
	Client,
	Collection,
	CommandInteraction,
	ForumChannel,
	Guild,
	IntentsBitField,
} from "discord.js";
import { CommandHandler } from "#handlers/CommandHandler";
import EventHandler from "#handlers/EventHandler";
import { InteractionHandler } from "#handlers/InteractionHandler";
import { Prisma, PrismaClient } from "#prisma";
import { InteractionType } from "#types/Commands";
import { Config } from "#types/Config";
import config from "../../config.json" with { type: "json" };
import HostingsCreateManyInput = Prisma.HostingsCreateManyInput;
import * as Sentry from "@sentry/node";

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
	// biome-ignore lint/suspicious/noExplicitAny: to much things to change to add type here
	commands: Collection<string, any>;
	interactions: Collection<string, InteractionType>;
	config: Config;
	prisma: PrismaClient;
	Sentry: Sentry.NodeClient;

	constructor() {
		super({
			intents: [
				IntentsBitField.Flags.Guilds,
				IntentsBitField.Flags.GuildMessages,
				IntentsBitField.Flags.GuildMembers,
				IntentsBitField.Flags.GuildModeration,
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
		if (process.env.SENTRY_URL !== "") {
			this.Sentry = Sentry.init({
				dsn: process.env.SENTRY_URL,
				normalizeDepth: 10,
			});
		}
		this.prisma = new PrismaClient({
			log: ["error", "warn"],
		});
		await this.initHostings();
		this.login(this.config.token).then(() => null);

		this.commands = await new CommandHandler(this).loadCommands();
		this.interactions = await new InteractionHandler(this).loadInteractions();

		new EventHandler(this).loadEvents().then(() => null);
	}

	ms(time = undefined): number {
		if (!time) {
			return undefined;
		}

		if (typeof time !== "string") {
			throw new Error("Time is not a string!");
		}

		time = this.chunk(
			time.split(/(\d+)(mo|[smhdyw])/gim).filter((e) => e),
			2,
		);

		let ms = 0;

		for (const array of time) {
			ms += durations[array[1] || "s"] * array[0];
		}

		if (isNaN(ms)) {
			return undefined;
		}

		return ms;
	}

	chunk(array, size): string[] {
		const arr = [];
		for (let i = 0; i < array.length; i += size) {
			arr.push(array.slice(i, i + size));
		}
		return arr;
	}

	async useModal(
		interaction:
			| CommandInteraction
			| ButtonInteraction
			| AnySelectMenuInteraction,
		modal: APIModalInteractionResponseCallbackData,
		timeout = this.ms("60s"),
	) {
		await interaction.showModal(modal);

		return interaction
			.awaitModalSubmit({
				time: timeout,
				filter: (filterInteraction) =>
					filterInteraction.customId === modal.custom_id &&
					filterInteraction.user.id === interaction.user.id,
			})
			.catch(() => null);
	}

	async fetchMessages(
		guild: Guild,
		limit = 100,
		before = null,
		after = null,
		around = null,
	) {
		let count = 0;

		for (const channel of guild.channels.cache
			.filter(
				(x) =>
					![
						ChannelType.GuildCategory,
						ChannelType.GuildDirectory,
						ChannelType.GuildStageVoice,
					].includes(x.type),
			)
			.values()) {
			if (channel instanceof ForumChannel) {
				for (const thread of channel.threads.cache.values()) {
					const fetched = await thread.messages
						.fetch({
							limit,
							before,
							after,
							around,
						})
						.catch(() => null);
					count += fetched?.size || 0;
				}
			} else {
				const fetched = await (channel as BaseGuildTextChannel).messages
					.fetch({
						limit,
						before,
						after,
						around,
					})
					.catch(() => null);
				count += fetched?.size || 0;
			}
		}

		return count;
	}

	async initHostings() {
		// Other is a default hosting for this table
		const hostings: HostingsCreateManyInput[] = [
			{
				hosting_id: "other",
				name: "Inne",
				website: null,
				icon: null,
				emoji: "❓",
			},
		];

		if ((await this.prisma.hostings.count()) === 0) {
			await this.prisma.hostings.createMany({
				data: hostings,
			});
		}
	}
}
