<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	type SearchResult = { id: string; name: string; universeName: string };

	let query = $state('');
	let results = $state<SearchResult[]>([]);
	let isOpen = $state(false);
	let selectedIndex = $state(-1);
	let debounceTimer: ReturnType<typeof setTimeout>;
	let inputEl: HTMLInputElement;

	$effect(() => {
		clearTimeout(debounceTimer);
		if (!query.trim()) {
			results = [];
			isOpen = false;
			return;
		}
		debounceTimer = setTimeout(async () => {
			const res = await fetch(`/api/characters/search?q=${encodeURIComponent(query.trim())}`);
			if (res.ok) {
				results = await res.json();
				isOpen = results.length > 0;
				selectedIndex = -1;
			}
		}, 250);
	});

	function close() {
		isOpen = false;
		selectedIndex = -1;
	}

	function selectResult(character: SearchResult) {
		query = '';
		results = [];
		close();
		goto(resolve(`/characters/${character.id}`));
	}

	function onKeydown(e: KeyboardEvent) {
		if (!isOpen) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selectedIndex = Math.max(selectedIndex - 1, -1);
		} else if (e.key === 'Enter' && selectedIndex >= 0) {
			e.preventDefault();
			selectResult(results[selectedIndex]);
		} else if (e.key === 'Escape') {
			close();
			inputEl.blur();
		}
	}

	function onBlur() {
		// Delay so mousedown on a result fires before the dropdown closes
		setTimeout(close, 150);
	}
</script>

<div class="relative">
	<div
		class="flex items-center gap-2 rounded-full border border-surface-300 bg-surface-50 px-3 py-1.5 dark:border-surface-600 dark:bg-surface-900"
	>
		<svg
			class="size-4 shrink-0 text-surface-500"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			/>
		</svg>
		<input
			bind:this={inputEl}
			bind:value={query}
			type="search"
			placeholder="Find character…"
			class="w-36 bg-transparent text-sm transition-[width] duration-200 outline-none placeholder:text-surface-400 focus:w-48"
			aria-label="Search characters"
			onkeydown={onKeydown}
			onblur={onBlur}
		/>
	</div>

	{#if isOpen}
		<ul
			role="listbox"
			aria-label="Character search results"
			class="forge-panel absolute top-full left-0 z-100 mt-1 w-64 overflow-hidden py-1 backdrop-blur"
		>
			{#each results as character, i (character.id)}
				<li role="option" aria-selected={i === selectedIndex}>
					<button
						class="flex w-full flex-col px-4 py-2 text-left hover:bg-surface-100 dark:hover:bg-surface-800 {i ===
						selectedIndex
							? 'bg-surface-100 dark:bg-surface-800'
							: ''}"
						onmousedown={() => selectResult(character)}
					>
						<span class="text-sm font-medium text-surface-950 dark:text-surface-50"
							>{character.name}</span
						>
						<span class="text-xs text-surface-500">{character.universeName}</span>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
