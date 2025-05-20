import { ActivityType, Routes } from "discord-api-types/v10";
import Ryneczek from "#client";

export async function run(client: Ryneczek) {
	console.log(`${client.user.tag} is ready!`);

	client.user.setActivity("rynek", {
		type: ActivityType.Watching,
	});

	console.log(
		`Successfully fetched ${await client.fetchMessages(client.guilds.cache.get(client.config.guild_id))} messages.`,
	);
	console.log(
		`Successfully fetched ${(await client.guilds.cache.get(client.config.guild_id).members.fetch()).size} members.`,
	);

	if (process.argv.includes("--deploy")) {
		await client.rest.put(
			Routes.applicationGuildCommands(client.user.id, client.config.guild_id),

			{
				body: [
					...client.commands.map((x) => x.data),
					...client.commands
						.filter((x) => x.data.context)
						.map((x) => x.data.context),
				],
			},
		);

		console.log("Pomyslnie zaktualizowano slashcommands!");
	}
}
