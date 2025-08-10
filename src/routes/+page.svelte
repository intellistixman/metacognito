<script lang="ts">
	import { onMount } from 'svelte';
	import { Camera, CameraOff, Menu, MonitorPlay } from '@lucide/svelte';
	import { drawerStore } from '$lib/stores/drawer.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { toaster } from '$lib/stores/toaster.svelte';
	import Toaster from '$lib/components/Toaster.svelte';
	import Stream from '$lib/components/Stream.svelte';

	let cameraStream: MediaStream | null = $state(null);
	let isCameraActive = $state(false);
	let errorMessage = $state('');
	let isCapturingDisplays = $state(false);
	let displayStreams: Array<{
		id: string;
		stream: MediaStream;
		name: string;
	}> = $state([]);
	let nextDisplayId = 1;

	let totalStreamsCount = $derived(displayStreams.length + (isCameraActive ? 1 : 0));

	const MAX_STREAMS = 4;

	const MAX_STREAMS_TOASTER_MESSAGE = {
		title: `Max ${MAX_STREAMS} streams have been reached`,
		description: 'Please remove a stream to capture another one'
	};

	let disableCamera = $derived(totalStreamsCount >= MAX_STREAMS || cameraStream !== null);

	async function captureDisplay() {
		try {
			errorMessage = '';
			if (totalStreamsCount >= MAX_STREAMS) {
				toaster.error(MAX_STREAMS_TOASTER_MESSAGE);
				return;
			}
			isCapturingDisplays = true;

			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: {
					displaySurface: 'monitor'
				},
				audio: false
			});

			// Create a unique ID for this display
			const displayId = `display-${nextDisplayId++}`;
			const displayName = `Display ${displayStreams.length + 1}`;

			// Add the stream to our array
			displayStreams = [
				...displayStreams,
				{
					id: displayId,
					stream: stream,
					name: displayName
				}
			];

			// Handle stream ending
			stream.getVideoTracks()[0].onended = () => {
				removeDisplayStream(displayId);
			};

			isCapturingDisplays = false;
		} catch (error) {
			errorMessage = `Display capture error: ${error instanceof Error ? error.message : 'Unknown error'}`;
			console.error('Display capture error:', error);
			isCapturingDisplays = false;
		}
	}

	function removeDisplayStream(displayId: string) {
		displayStreams = displayStreams.filter((display) => {
			if (display.id === displayId) {
				display.stream.getTracks().forEach((track) => track.stop());
				return false;
			}
			return true;
		});
	}

	function stopAllDisplays() {
		displayStreams.forEach((display) => {
			display.stream.getTracks().forEach((track) => track.stop());
		});
		displayStreams = [];
	}

	async function startCamera() {
		try {
			errorMessage = '';
			if (totalStreamsCount >= MAX_STREAMS) {
				toaster.error(MAX_STREAMS_TOASTER_MESSAGE);
				return;
			}
			cameraStream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: 1280 },
					height: { ideal: 720 }
				},
				audio: false
			});
			isCameraActive = true;
		} catch (error) {
			errorMessage = `Camera error: ${error instanceof Error ? error.message : 'Unknown error'}`;
			console.error('Camera error:', error);
		}
	}

	function stopCamera() {
		if (cameraStream) {
			cameraStream.getTracks().forEach((track) => track.stop());
			cameraStream = null;
		}
		isCameraActive = false;
	}

	function toggleDrawer() {
		drawerStore.update((state) => ({
			...state,
			open: true
		}));
	}

	onMount(() => {
		return () => {
			stopAllDisplays();
			stopCamera();
		};
	});
</script>

<svelte:head>
	<title>Multi-Display & Camera Streams</title>
</svelte:head>

<main class="flex h-screen w-full flex-col overflow-hidden p-4">
	<div class="burger-menu">
		<!-- TODO: Hidden when drawer is open -->
		<button class={`burger-menu-btn`} onclick={toggleDrawer}>
			<Menu />
		</button>
	</div>

	{#if totalStreamsCount > 0}
		<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
			{#each displayStreams as display (display.id)}
				<Stream
					classes="stream-item"
					name={display.name}
					stream={display.stream}
					onRemove={() => removeDisplayStream(display.id)}
				/>
			{/each}

			{#if isCameraActive && cameraStream}
				<Stream classes="stream-item" name={'Camera'} stream={cameraStream} onRemove={stopCamera} />
			{/if}
		</div>
	{:else}
		<div class="empty-state">
			<h3>No streams active</h3>
			<p>Click "Add Display" to capture a screen or "Start Camera" to activate your webcam</p>
		</div>
	{/if}

	<div class="snackbar flex justify-center gap-4">
		<button
			class="snackbar-btn"
			onclick={captureDisplay}
			disabled={isCapturingDisplays || totalStreamsCount >= MAX_STREAMS}
		>
			{#if isCapturingDisplays}
				<span class="loading-spinner"></span>
				Capturing...
			{:else}
				<MonitorPlay /> Display
			{/if}
		</button>
		{#if isCameraActive}
			<button class="snackbar-btn" onclick={stopCamera}>
				<CameraOff /> Stop
			</button>
		{:else}
			<button class="snackbar-btn" onclick={startCamera}>
				<Camera /> Camera
			</button>
		{/if}
	</div>

	<Modal />
	<Toaster />
</main>

<style>
	.burger-menu {
		position: fixed;
		top: 2rem;
		left: 2rem;
		z-index: 9999;

		.burger-menu-btn {
			background-color: grey;
			color: white;
			border: none;
			border-radius: 50px;
			padding: 1rem;
		}
	}

	/* stream headings are styled in `Stream.svelte` */

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		background-color: #f8f9fa;
		border-radius: 12px;
		border: 2px dashed #dee2e6;
		margin-bottom: 2rem;
	}

	.empty-state h3 {
		color: #6c757d;
		margin-bottom: 1rem;
	}

	.empty-state p {
		color: #6c757d;
		margin: 0;
	}

	.snackbar {
		position: fixed;
		bottom: 2rem;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
	}

	.snackbar-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem 2rem;
		background-color: #007bff;
		color: white;
		border: none;
		border-radius: 50px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
		min-width: 160px;
		justify-content: center;
	}

	.snackbar-btn:hover:not(:disabled) {
		background-color: #0056b3;
		box-shadow: 0 6px 16px rgba(0, 123, 255, 0.4);
		transform: translateY(-2px);
	}

	.snackbar-btn:disabled {
		background-color: #6c757d;
		cursor: not-allowed;
		transform: none;
		box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
	}

	.loading-spinner {
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.snackbar {
			bottom: 1rem;
		}

		.snackbar-btn {
			padding: 0.875rem 1.5rem;
			font-size: 0.9rem;
			min-width: 140px;
		}
	}
</style>
