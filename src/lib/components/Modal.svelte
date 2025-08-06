<script lang="ts">
	import { Modal } from '@skeletonlabs/skeleton-svelte';
	import { drawerStore } from '$lib/stores/drawer.svelte';
	import { X } from '@lucide/svelte';
	import Todo from './Todo.svelte';

	let drawerState = $state(false);

	drawerStore.subscribe((state) => {
		drawerState = state.open;
	});

	function drawerClose() {
		drawerStore.update((state) => ({
			...state,
			open: false
		}));
	}
</script>

<!--
Tips for Drawer modals:
- Use `contentBase` to set styles, including height/width
- Set justify-start to align to the left
- Clear the align and padding styles
- Use `positionerClasses` to set the
- Set transition.x values that matches content width in pixels
-->

<Modal
	open={drawerState}
	contentBase="bg-surface-100-900 p-4 space-y-4 shadow-xl w-[480px] h-screen"
	positionerJustify="justify-start"
	positionerAlign=""
	positionerPadding=""
	transitionsPositionerIn={{ x: -480, duration: 200 }}
	transitionsPositionerOut={{ x: -480, duration: 200 }}
>
	{#snippet content()}
		<header class="flex items-center justify-between">
			<div class="h4">Settings</div>
			<button type="button" class="btn" onclick={drawerClose}>
				<X size="24" class="font-bold" />
			</button>
		</header>
		<Todo />
	{/snippet}
</Modal>
