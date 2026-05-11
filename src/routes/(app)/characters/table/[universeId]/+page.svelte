<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';
	import CharacterTable from '$lib/components/CharacterTable.svelte';
	import ViewToggle from '$lib/components/ViewToggle.svelte';

	let { data, form }: PageProps = $props();
</script>

<section class="space-y-6">
	<div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
		<ViewToggle />
		<a class="forge-button" href={resolve('/characters/create')}>Create a character</a>
	</div>

	<CharacterTable
		characters={data.characters}
		traitDefinitions={data.traitDefinitions}
		universes={data.universes}
		selectedUniverseId={data.selectedUniverseId}
		{form}
	/>
</section>
