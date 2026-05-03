<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<section class="space-y-6">
	<div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
		<div>
			<span class="forge-badge">Character directory</span>
			<h2 class="mt-3 text-4xl font-semibold tracking-tight text-surface-950">Your cast, organized by universe.</h2>
			<p class="mt-3 max-w-2xl text-base leading-7 text-surface-700">Each card is private to your account and grouped under the owning universe that defines its trait schema.</p>
		</div>

		<a class="forge-button" href="/characters/create">Create a character</a>
	</div>

	{#if data.characters.length === 0}
		<div class="forge-panel p-8 text-center">
			<h3 class="text-2xl font-semibold text-surface-950">No characters yet</h3>
			<p class="mt-3 text-surface-700">Create your first entry to start attaching trait data, markdown biographies, and gallery images.</p>
			<a class="forge-button mt-6" href="/characters/create">Open the character form</a>
		</div>
	{:else}
		<div class="forge-card-grid">
			{#each data.characters as character (character.id)}
				<article class="forge-panel flex h-full flex-col p-6">
					<div class="flex items-center justify-between gap-4">
						<span class="forge-badge">{character.universeName}</span>
						<span class="text-xs uppercase tracking-[0.18em] text-surface-600">Updated {character.updatedAt.toLocaleDateString()}</span>
					</div>

					<div class="mt-5 flex-1 space-y-3">
						<h3 class="text-2xl font-semibold text-surface-950">{character.name}</h3>
						<p class="line-clamp-4 text-sm leading-7 text-surface-700">{character.summary || 'No summary yet.'}</p>
					</div>

					<div class="mt-6 flex items-center justify-between gap-4">
						<span class="text-sm text-surface-600">Created {character.createdAt.toLocaleDateString()}</span>
						<a class="forge-link text-sm font-semibold" href={`/characters/${character.id}`}>Open profile</a>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>
