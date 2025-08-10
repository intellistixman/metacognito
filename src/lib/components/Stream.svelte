<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import stixman from '$lib/assets/stixman.jpeg';

	type Props = {
		name: string;
		stream: MediaStream;
		onRemove: () => void;
		classes?: string;
	};
	let { name, stream, onRemove, classes }: Props = $props();

	let videoElement: HTMLVideoElement | null = null;

	$effect(() => {
		if (videoElement && stream) {
			// @ts-ignore - srcObject is supported on HTMLVideoElement
			videoElement.srcObject = stream as any;
		}
	});
</script>

<div class={`${classes}`}>
	<h3 class="mb-4 text-center text-gray-600">{name}</h3>

	<div class="relative aspect-video overflow-hidden rounded-xl border-2 border-gray-200 bg-gray-50">
		<video bind:this={videoElement} autoplay muted playsinline class="h-full w-full object-cover"
		></video>

		<div class="absolute right-4 bottom-4 z-10 flex flex-row items-center gap-3">
			<div
				class="dialog relative max-w-xs rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
			>
				<h1 class="m-0 mb-1 text-base font-semibold text-gray-800">Hi, I'm Stixman</h1>
				<p class="m-0 text-sm leading-relaxed text-gray-600">
					I'm a friendly AI assistant that can help you with your tasks.
				</p>
			</div>
			<Avatar src={stixman} name="Stixman" classes="pointer-events-none" />
		</div>

		<button
			type="button"
			class="absolute top-2 right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-red-600/90 text-xl font-bold text-white transition-colors hover:bg-red-600"
			onclick={onRemove}
			title="Remove this stream"
		>
			×
		</button>
	</div>
</div>

<style>
	.dialog::after {
		content: '';
		position: absolute;
		right: 24px;
		bottom: -10px;
		transform: none;
		width: 0;
		height: 0;
		border-top: 10px solid white;
		border-left: 10px solid transparent;
		border-right: 10px solid transparent;
	}

	.dialog::before {
		content: '';
		position: absolute;
		right: 24px;
		bottom: -12px;
		transform: none;
		width: 0;
		height: 0;
		border-top: 10px solid #e9ecef;
		border-left: 10px solid transparent;
		border-right: 10px solid transparent;
	}
</style>
