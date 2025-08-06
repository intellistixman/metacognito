import { writable } from 'svelte/store';

export const drawerStore = writable({
	open: false
});
