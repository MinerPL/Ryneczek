import {
	EmbedBuilder,
	SlashCommandBuilder,
	CommandInteraction,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	PermissionFlagsBits,
	GuildMember
} from 'discord.js';
import Ryneczek from '@classes/Ryneczek';
import { readFileSync } from 'fs';
import { Channel } from 'types/Config';

const getLeftTimeTimestamps = (client: Ryneczek, slowmode: object): string[] => {
	const returnArray = [];
	for (const [key, value] of Object.entries(slowmode)) {
		returnArray.push(`<#${key}> - <t:${(value / 1000).toFixed(0)}:R>`);
	}

	let restChannels: Channel;
	for(restChannels of client.config.channels.filter(ch => ch.slowmode)) {
		if(Object.keys(slowmode).includes(restChannels.id)) continue;
		returnArray.push(`<#${restChannels.id}> - Brak`);
	}

	return returnArray;
};


export const data = {
	...new SlashCommandBuilder()
		.setName('slowmode')
		.setDescription('Sprawdź swój aktualny slowmode!')
		.addUserOption(o =>
			o.setName('użytkownik')
				.setDescription('Wybierz użytkownika którego slowmode chcesz sprawdzić')
				.setRequired(false),
		)
		.toJSON(),
};

export async function run(client: Ryneczek, interaction: CommandInteraction) {
	const user = interaction.options.getUser('użytkownik') || interaction.user;


	const slowmode = JSON.parse(readFileSync('./slowmode.json', 'utf-8'))[user.id] || {};

	const embed = new EmbedBuilder()
		.setTitle(`Slowmode użytkownik ${user.tag}`)
		.setColor('#92c55f')
		.setDescription(getLeftTimeTimestamps(client, slowmode).join('\n'));

	const components = [];


	if((interaction.member as GuildMember).permissions.has(PermissionFlagsBits.ModerateMembers)) {
		components.push(new ActionRowBuilder()
			.addComponents([
				new ButtonBuilder()
					.setStyle(ButtonStyle.Danger)
					.setLabel('Reset Slowmode')
					.setCustomId(`slowmode_${user.id}`),
			]));
	}

	return interaction.reply({ embeds: [embed], ephemeral: true, components });
}