<script lang="ts">
	import { onMount } from 'svelte';
	import { dbService } from '$lib/services/indexedDB';
	import { toaster } from '../stores/toaster.svelte';

	const SYSTEM_PROMPT_SLUG = 'system';
	const METACOGNITIVE_PROMPT_SLUG = 'metacognitive';

	let systemPrompt = $state('');
	let metacognitoPrompt = $state('');
	let isLoading = $state(true);

	onMount(async () => {
		try {
			await dbService.init();
			const savedPrompts = await dbService.getAllPrompts();
			systemPrompt = savedPrompts[SYSTEM_PROMPT_SLUG]?.prompt || '';
			metacognitoPrompt = savedPrompts[METACOGNITIVE_PROMPT_SLUG]?.prompt || '';
		} catch (error) {
			console.error(error);
		} finally {
			isLoading = false;
		}

		// return () => {};
	});

	async function saveSystemPrompt() {
		try {
			await dbService.updatePrompt({
				slug: SYSTEM_PROMPT_SLUG,
				prompt: systemPrompt
			});
			toaster.create({
				title: 'System prompt saved!'
			});
		} catch (error) {
			console.error(error);
			toaster.create({
				title: 'Failed to save system prompt'
			});
		}
	}

	async function saveMetacognitivePrompt() {
		try {
			await dbService.updatePrompt({
				slug: METACOGNITIVE_PROMPT_SLUG,
				prompt: metacognitoPrompt
			});
			toaster.create({
				title: 'Metacognitive prompt saved!'
			});
		} catch (error) {
			console.error(error);
			toaster.create({
				title: 'Failed to save metacognitive prompt'
			});
		}
	}
</script>

<div class="w-full max-w-md space-y-4">
	<div class="h4">Prompts</div>

	<div class="space-y-4">
		<div class="space-y-2">
			<label class="label">
				<span class="label-text">System Prompt</span>
				<textarea class="input" placeholder="Enter name" rows={5} bind:value={systemPrompt}
				></textarea>
			</label>
			<button class="btn w-full preset-tonal-primary" onclick={saveSystemPrompt}>Save</button>
		</div>

		<div class="space-y-4">
			<label class="label">
				<span class="label-text">Metacognitive Prompt</span>
				<textarea class="input" placeholder="Enter name" rows={5} bind:value={metacognitoPrompt}
				></textarea>
			</label>
			<button class="btn w-full preset-tonal-primary" onclick={saveMetacognitivePrompt}>
				Save
			</button>
		</div>
	</div>
</div>
