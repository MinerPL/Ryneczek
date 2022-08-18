export async function suggestionCreate(client, message) {
	await message.react('👍');
	await message.react('👎');

	const theard = await message.startThread({
		name: 'Komentarze do propozycji',
		autoArchiveDuration: 10080,
		reason: `Komentarz do propozycji uzytkownika ${message.author.tag}`,
	});

	await theard.members.add(message.author.id);
}