<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import CharacterTable from '$lib/components/CharacterTable.svelte';
	import ViewToggle from '$lib/components/ViewToggle.svelte';

	let { data, form }: PageProps = $props();

	let importedCount = $derived(Number(page.url.searchParams.get('imported') ?? '') || 0);
</script>

<section class="space-y-6">
	<div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
		<ViewToggle />
		<a class="forge-button" href={resolve('/characters/create')}>Create a character</a>
	</div>

	{#if importedCount > 0}
		<p
			class="rounded-2xl border border-success-300 bg-success-50 px-4 py-3 text-sm text-success-900"
		>
			✓ {importedCount} character{importedCount === 1 ? '' : 's'} imported successfully.
		</p>
	{/if}

	<CharacterTable
		characters={data.characters}
		traitDefinitions={data.traitDefinitions}
		universes={data.universes}
		selectedUniverseId={null}
		{form}
	/>
</section>
