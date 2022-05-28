export function clearFile(slowmode: object): Record<string, any> {

	for(const [user, data] of Object.entries(slowmode)) {

		for(const [channel, time] of Object.entries(data)) {
			if(time < Date.now()) {
				delete slowmode[user][channel];
			}
		}

		if(Object.keys(slowmode[user]).length === 0) {
			delete slowmode[user];
		}
	}

	return slowmode;
}