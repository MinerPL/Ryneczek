import { CreateDiscussion, Discusions, Discussion, TagsResponse } from '../types/Flarum';
import { RequestInit } from 'undici';

export default class HostGier {
	apiKey: string;
	forumUrl: string = 'https://forum.hostgier.pl';
	tags: TagsResponse[] | null = null;
	constructor(apiKey: string) {
		this.apiKey = apiKey;

		this.fetchTags();
	}

	private async request(url: string, options: RequestInit = {
		method: 'GET',
	}) {
		try {
			const req = await fetch(`${this.forumUrl}${url}`, {
				method: options.method ?? 'GET',
				...options,
				// @ts-expect-error
				body: options?.method === 'GET' ? null : options.body ?? {},
				headers: {
					'Content-Type': 'application/json',
					'Accept': 'application/json',
					'Authorization': `Token ${this.apiKey}`,
				},
			});

			return await req.json();
		}
		catch(e) {
			console.log(e);
			return null;
		}
	}

	private fetchTags(): void {
		this.request('/api/tags', {
			method: 'GET',
		}).then((data: {data: TagsResponse[]}) => {
			this.tags = data.data;
			console.log('Fetched tags from HostGier.');
		});
	}

	async getDiscussions(): Promise<Discusions> {
		return await this.request('/api/discussions', {
			method: 'GET',
		});
	}

	async createDiscussion(data: CreateDiscussion): Promise<Discussion> {
		return await this.request('/api/discussions', {
			method: 'POST',
			body: JSON.stringify(data || {}),
		});
	}
}