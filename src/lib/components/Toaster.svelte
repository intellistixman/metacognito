<script lang="ts">
	import { Toaster } from '@skeletonlabs/skeleton-svelte';
	import { toaster } from '$lib/stores/toaster.svelte';
</script>

<Toaster {toaster}></Toaster>
