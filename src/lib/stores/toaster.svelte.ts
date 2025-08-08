import { createToaster } from '@skeletonlabs/skeleton-svelte';

export const toaster = createToaster({
	duration: 3000,
	placement: 'bottom-end'
});
