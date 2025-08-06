<script lang="ts">
	import { onMount } from 'svelte';
	import { draggable } from '@neodrag/svelte';
	import { Camera, CameraOff, Menu, MonitorPlay } from '@lucide/svelte';
	import stixman from '$lib/assets/stixman.jpeg';
	import { drawerStore } from '$lib/stores/drawer.svelte';
	import Modal from '$lib/components/Modal.svelte';

	let cameraStream: MediaStream | null = null;
	let cameraVideo: HTMLVideoElement;
	let draggableCameraVideo: HTMLVideoElement;
	let isCameraActive = false;
	let errorMessage = '';
	let isCapturingDisplays = false;
	let isInitialized = false;
	let displayStreams: Array<{
		id: string;
		stream: MediaStream;
		name: string;
		videoElement: HTMLVideoElement;
	}> = [];
	let nextDisplayId = 1;

	async function captureDisplay() {
		try {
			errorMessage = '';
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
					name: displayName,
					videoElement: null as any // Will be set by bind:this
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
				if (display.videoElement) {
					display.videoElement.srcObject = null;
				}
				return false;
			}
			return true;
		});
	}

	function stopAllDisplays() {
		displayStreams.forEach((display) => {
			display.stream.getTracks().forEach((track) => track.stop());
			if (display.videoElement) {
				display.videoElement.srcObject = null;
			}
		});
		displayStreams = [];
	}

	async function startCamera() {
		try {
			errorMessage = '';
			cameraStream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: 1280 },
					height: { ideal: 720 }
				},
				audio: false
			});
			if (draggableCameraVideo) {
				draggableCameraVideo.srcObject = cameraStream;
			}
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
		if (draggableCameraVideo) {
			draggableCameraVideo.srcObject = null;
		}
		isCameraActive = false;
	}

	// Update video element when display is added
	$effect(() => {
		displayStreams.forEach((display) => {
			if (display.videoElement && display.stream) {
				display.videoElement.srcObject = display.stream;
			}
		});

		if (draggableCameraVideo && cameraStream && isCameraActive) {
			draggableCameraVideo.srcObject = cameraStream;
		}
	});

	// // Update draggable camera video when stream is available
	// $: if (draggableCameraVideo && cameraStream && isCameraActive) {
	// 	draggableCameraVideo.srcObject = cameraStream;
	// }

	let drawerOpen = $state(false);

	function toggleDrawer() {
		drawerStore.update((state) => ({
			...state,
			open: true
		}));
	}

	onMount(() => {
		console.log('onMount');
		// Small delay to prevent initial positioning glitch
		setTimeout(() => {
			isInitialized = true;
		}, 100);

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
		<button class="burger-menu-btn" onclick={toggleDrawer} class:visible={false}>
			<Menu />
		</button>
	</div>

	{#if displayStreams.length > 0}
		<div class="streams-grid">
			{#each displayStreams as display (display.id)}
				<div class="stream-item">
					<h3>{display.name}</h3>
					<div class="video-wrapper">
						<video bind:this={display.videoElement} autoplay muted playsinline class="video-element"
						></video>
						<button
							class="remove-btn"
							onclick={() => removeDisplayStream(display.id)}
							title="Remove this display"
						>
							×
						</button>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty-state">
			<h3>No streams active</h3>
			<p>Click "Add Display" to capture a screen or "Start Camera" to activate your webcam</p>
		</div>
	{/if}

	{#if isCameraActive}
		<div
			class="camera-video-container"
			use:draggable={{
				defaultPosition: { x: 50, y: window.innerHeight * 0.7 }
			}}
		>
			<video bind:this={draggableCameraVideo} autoplay muted playsinline class="camera-video"
			></video>
		</div>
	{/if}

	<div
		class="avatar-container flex flex-row gap-4"
		class:visible={isInitialized}
		use:draggable={{
			defaultPosition: { x: window.outerWidth * 0.65, y: window.outerHeight * 0.4 },
			bounds: 'body'
		}}
	>
		<div class="dialog">
			<h1>Hi, I'm Stixman</h1>
			<p>I'm a friendly AI assistant that can help you with your tasks.</p>
		</div>
		<div class="avatar">
			<img src={stixman} alt="Stixman Avatar" />
		</div>
	</div>

	<div class="snackbar flex justify-center gap-4">
		<button class="snackbar-btn" onclick={captureDisplay} disabled={isCapturingDisplays}>
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

	.streams-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 2rem;
		margin-bottom: 2rem;
	}

	@media (max-width: 768px) {
		.streams-grid {
			grid-template-columns: 1fr;
		}
	}

	.stream-item h3 {
		text-align: center;
		margin-bottom: 1rem;
		color: #555;
	}

	.video-wrapper {
		position: relative;
		background-color: #f8f9fa;
		border-radius: 12px;
		overflow: hidden;
		aspect-ratio: 16/9;
		border: 2px solid #e9ecef;
	}

	.video-element {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	.remove-btn {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background-color: rgba(220, 53, 69, 0.9);
		color: white;
		border: none;
		font-size: 1.2rem;
		font-weight: bold;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s ease;
	}

	.remove-btn:hover {
		background-color: rgba(220, 53, 69, 1);
	}

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

	.camera-video-container {
		position: fixed;
		z-index: 9999;
		width: 480px;
		height: 240px;
		border: none;
		border-radius: 12px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
		transition: all 0.3s ease;
		overflow: hidden;
	}

	.camera-video-container .camera-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-container {
		position: fixed;
		z-index: 9999;
		cursor: grab;
		opacity: 0;
		transition: opacity 0.3s ease-in-out;
	}

	.avatar-container.visible {
		opacity: 1;

		.dialog {
			background: white;
			border-radius: 20px;
			padding: 1.5rem;
			box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
			border: 2px solid #e9ecef;
			max-width: 300px;
			position: relative;

			h1 {
				margin: 0 0 0.5rem 0;
				font-size: 1.25rem;
				font-weight: 600;
				color: #333;
			}

			p {
				margin: 0;
				color: #666;
				line-height: 1.5;
				font-size: 0.95rem;
			}

			&::after {
				content: '';
				position: absolute;
				right: -12px;
				top: 50%;
				transform: translateY(-50%);
				width: 0;
				height: 0;
				border-left: 12px solid white;
				border-top: 12px solid transparent;
				border-bottom: 12px solid transparent;
			}

			&::before {
				content: '';
				position: absolute;
				right: -14px;
				top: 50%;
				transform: translateY(-50%);
				width: 0;
				height: 0;
				border-left: 12px solid #e9ecef;
				border-top: 12px solid transparent;
				border-bottom: 12px solid transparent;
			}
		}

		.avatar {
			width: 240px;
			height: 240px;
			border-radius: 50%;
			overflow: hidden;
			border: 2px solid #e9ecef;

			img {
				z-index: 1;
				width: 100%;
				height: 100%;
				object-fit: cover;
				pointer-events: none;
				user-select: none;
			}
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
