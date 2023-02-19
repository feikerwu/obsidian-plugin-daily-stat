export class Storage {
	get(key: string) {
		return localStorage.getItem(key);
	}

	set(key: string, value: any) {
		localStorage.setItem(key, JSON.stringify(value));
	}
}
