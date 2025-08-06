export interface TodoItem {
	id?: number;
	task: string;
	isDone: boolean;
	createdAt: Date;
}

export interface Prompt {
	slug: string;
	prompt: string;
}

interface Prompts {
	[key: string]: Prompt;
}

class IndexedDBService {
	private dbName = 'TodoDB';
	private version = 2;
	private storeName = 'todos';
	private promptsStoreName = 'prompts';
	private db: IDBDatabase | null = null;

	async init(): Promise<void> {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.version);

			request.onerror = () => {
				reject(new Error('Failed to open IndexedDB'));
			};

			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};

			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;

				if (!db.objectStoreNames.contains(this.storeName)) {
					const store = db.createObjectStore(this.storeName, {
						keyPath: 'id',
						autoIncrement: true
					});
					store.createIndex('createdAt', 'createdAt', { unique: false });
				}

				if (!db.objectStoreNames.contains(this.promptsStoreName)) {
					const store = db.createObjectStore(this.promptsStoreName, {
						keyPath: 'slug',
						autoIncrement: true
					});
					store.createIndex('createdAt', 'createdAt', { unique: false });
				}
			};
		});
	}

	async getAllTodos(): Promise<TodoItem[]> {
		if (!this.db) {
			await this.init();
		}

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([this.storeName], 'readonly');
			const store = transaction.objectStore(this.storeName);
			const request = store.getAll();

			request.onsuccess = () => {
				resolve(request.result || []);
			};

			request.onerror = () => {
				reject(new Error('Failed to fetch todos'));
			};
		});
	}

	async getAllPrompts(): Promise<Prompts> {
		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([this.promptsStoreName], 'readonly');
			const store = transaction.objectStore(this.promptsStoreName);
			const request = store.getAll();

			request.onsuccess = () => {
				resolve(
					request.result.reduce((obj, prompt) => {
						obj[prompt.slug] = prompt;
						return obj;
					}, {} as Prompts)
				);
			};

			request.onerror = () => {
				reject(new Error('Failed to fetch prompts'));
			};
		});
	}

	async updatePrompt(prompt: Prompt): Promise<void> {
		if (!this.db) {
			await this.init();
		}

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([this.promptsStoreName], 'readwrite');
			const store = transaction.objectStore(this.promptsStoreName);
			const request = store.put(prompt);

			request.onsuccess = () => {
				resolve();
			};

			request.onerror = () => {
				reject(new Error('Failed to update prompt'));
			};
		});
	}

	async addTodo(todo: Omit<TodoItem, 'id'>): Promise<TodoItem> {
		if (!this.db) {
			await this.init();
		}

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([this.storeName], 'readwrite');
			const store = transaction.objectStore(this.storeName);
			const request = store.add({
				...todo,
				createdAt: new Date()
			});

			request.onsuccess = () => {
				resolve({
					...todo,
					id: request.result as number,
					createdAt: new Date()
				});
			};

			request.onerror = () => {
				reject(new Error('Failed to add todo'));
			};
		});
	}

	async updateTodo(todo: TodoItem): Promise<void> {
		if (!this.db) {
			await this.init();
		}

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([this.storeName], 'readwrite');
			const store = transaction.objectStore(this.storeName);

			const request = store.put({
				...todo // Cannot clone object directly
			});

			request.onsuccess = () => {
				resolve();
			};

			request.onerror = () => {
				reject(new Error('Failed to update todo'));
			};
		});
	}

	async deleteTodo(id: number): Promise<void> {
		if (!this.db) {
			await this.init();
		}

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([this.storeName], 'readwrite');
			const store = transaction.objectStore(this.storeName);
			const request = store.delete(id);

			request.onsuccess = () => {
				resolve();
			};

			request.onerror = () => {
				reject(new Error('Failed to delete todo'));
			};
		});
	}

	async clearAllTodos(): Promise<void> {
		if (!this.db) {
			await this.init();
		}

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction([this.storeName], 'readwrite');
			const store = transaction.objectStore(this.storeName);
			const request = store.clear();

			request.onsuccess = () => {
				resolve();
			};

			request.onerror = () => {
				reject(new Error('Failed to clear todos'));
			};
		});
	}
}

export const dbService = new IndexedDBService();
