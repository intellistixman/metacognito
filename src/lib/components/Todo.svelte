<script lang="ts">
	import { onMount } from 'svelte';
	import { dbService, type TodoItem } from '$lib/services/indexedDB';
	import { toaster } from '../stores/toaster.svelte';

	let todoItems: TodoItem[] = $state([]);
	let newTask = $state('');
	let isLoading = $state(true);

	// Load todos from IndexedDB on component mount
	onMount(async () => {
		try {
			await dbService.init();
			const savedTodos = await dbService.getAllTodos();

			todoItems = savedTodos || [];
		} catch (error) {
			console.error('Failed to load todos:', error);
		} finally {
			isLoading = false;
		}
	});

	async function addTask() {
		if (newTask.trim()) {
			try {
				const newTodo = await dbService.addTodo({
					task: newTask.trim(),
					isDone: false,
					createdAt: new Date()
				});
				todoItems.push(newTodo);
				newTask = '';
				toaster.success({
					title: 'Task added!'
				});
			} catch (error) {
				console.error('Failed to add task:', error);
				toaster.error({
					title: 'Failed to add task',
					description: error instanceof Error ? error.message : 'Unknown error'
				});
			}
		}
	}

	async function toggleTask(index: number) {
		try {
			const todo = todoItems[index];
			todo.isDone = !todo.isDone;
			await dbService.updateTodo(todo);
			// Trigger reactivity
			todoItems = [...todoItems];
			toaster.success({
				title: 'Congratulations!',
				description: 'You have completed a task!'
			});
		} catch (error) {
			console.error('Failed to toggle task:', error);
			toaster.error({
				title: 'Failed to update task',
				description: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	async function removeTask(index: number) {
		try {
			const todo = todoItems[index];
			if (todo.id) {
				await dbService.deleteTodo(todo.id);
				todoItems.splice(index, 1);
				// Trigger reactivity
				todoItems = [...todoItems];
				toaster.success({
					title: 'Task removed!'
				});
			}
		} catch (error) {
			console.error('Failed to remove task:', error);
			toaster.error({
				title: 'Failed to remove task',
				description: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}
</script>

<div class="w-full max-w-md space-y-4">
	<div class="space-y-2">
		<h4 class="h4">Todo List</h4>

		{#if isLoading}
			<div class="p-4 text-center">
				<div class="animate-pulse">Loading todos...</div>
			</div>
		{:else}
			<!-- Add new task form -->
			<form
				class="flex gap-2"
				onsubmit={(e) => {
					e.preventDefault();
					addTask();
				}}
			>
				<input
					type="text"
					class="input flex-1"
					placeholder="Add new task..."
					bind:value={newTask}
				/>
				<button type="submit" class="btn preset-filled">Add</button>
			</form>

			<div class="space-y-2">
				{#each todoItems as item, index (item.id || index)}
					<div class="flex items-center gap-3 rounded-lg bg-surface-200-800 p-3">
						<button
							class="variant-filled btn-icon"
							class:preset-filled={!item.isDone}
							class:variant-filled-success={item.isDone}
							onclick={() => toggleTask(index)}
						>
							{#if item.isDone}
								✓
							{:else}
								○
							{/if}
						</button>

						<span
							class="flex-1 text-left"
							class:line-through={item.isDone}
							class:opacity-60={item.isDone}
						>
							{item.task}
						</span>

						<button
							class="variant-ghost-error btn-icon text-xs"
							onclick={() => removeTask(index)}
							title="Remove task"
						>
							×
						</button>
					</div>
				{/each}

				{#if todoItems.length === 0}
					<div class="p-4 text-center opacity-60">No tasks yet. Add one above!</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.line-through {
		text-decoration: line-through;
	}
</style>
