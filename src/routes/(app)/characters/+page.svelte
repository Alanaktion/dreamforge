<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import ViewToggle from '$lib/components/ViewToggle.svelte';

	let { data }: PageProps = $props();
</script>

<section class="space-y-6">
	<div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
		<ViewToggle />
		<a class="forge-button" href={resolve('/characters/create')}>Create a character</a>
	</div>

	{#if data.characters.length === 0}
		<div class="forge-panel p-8 text-center">
			<h3 class="text-2xl font-semibold text-surface-950 dark:text-surface-50">
				No characters yet
			</h3>
			<p class="mt-3 text-surface-700 dark:text-surface-300">
				Create your first entry to start attaching trait data, markdown biographies, and
				gallery images.
			</p>
			<a class="forge-button mt-6" href={resolve('/characters/create')}
				>Open the character form</a
			>
		</div>
	{:else}
		<div class="forge-card-grid">
			{#each data.characters as character (character.id)}
				<article class="forge-panel flex h-full flex-col p-6">
					<div class="flex items-center justify-between gap-4">
						<span class="forge-badge">{character.universeName}</span>
						<span class="text-xs tracking-[0.18em] text-surface-600 uppercase"
							>Updated {character.updatedAt.toLocaleDateString()}</span
						>
					</div>

					<div class="mt-5 flex-1 space-y-3">
						<h3 class="text-2xl font-semibold text-surface-950 dark:text-surface-50">
							<a href={resolve(`/characters/${character.id}`)}>{character.name}</a>
						</h3>
						<p
							class="line-clamp-4 text-sm leading-7 text-surface-700 dark:text-surface-300"
						>
							{character.summary || 'No summary yet.'}
						</p>
					</div>

					<div class="mt-6 flex items-center justify-between gap-4">
						<span class="text-sm text-surface-600"
							>Created {character.createdAt.toLocaleDateString()}</span
						>
						<a
							class="forge-link text-sm font-semibold"
							href={resolve(`/characters/${character.id}`)}>Open profile</a
						>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>
